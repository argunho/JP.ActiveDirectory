﻿using ActiveDirectory.Interface;
using ActiveDirectory.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.DirectoryServices.AccountManagement;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Principal;
using System.Text;

namespace ActiveDirectory.Controllers;

[Route("[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IActiveDirectoryProvider _provider;
    private readonly IConfiguration _config;
    public AuthController(IActiveDirectoryProvider activeDirectory, IConfiguration config)
    {
        _provider = activeDirectory;
        _config = config;
    }

    #region GET
    // Validate user access first with Windows authentication username
    [HttpGet]
    public JsonResult AccessValidation()
    {
        var name = Environment.UserName;
        if (name == null)
        {
            var currentUser = WindowsIdentity.GetCurrent();
            if (currentUser != null)
                name = currentUser?.Name.ToString().Split('\\')[1];
        }

        var user = _provider.FindUserByName(name);
        var userTest = UserCredentials.Password;
        if (user != null && _provider.MembershipCheck(name))
        {
            var token = CreateJwtToken(user);
            UserCredentials.Username = name;
            UserCredentials.Email = user.EmailAddress;
            return new JsonResult(new
            {
                access = true,
                alert = "success",
                token = token,
                msg = "Din åtkomstbehörighet har bekräftats."
            });//Success! Your access has been confirmed.
        }

        return new JsonResult(new { access = false, alert = "warning", msg = "Åtkomst nekad! Du har inte behörighet att redigera elevs lösenord" }); //Failed! You do not have permission to edit a student's password
    }

    [HttpGet("credential/{password}")]
    [Authorize]
    public JsonResult SetFullCredential(string password)
    {
        if(UserCredentials.Fixing != null)
        {
            var time = DateTime.Now.Ticks - UserCredentials.Fixing?.AddMinutes(30).Ticks;
            if (time < 0)
            {
                return new JsonResult(new
                {
                    success = false,
                    msg = $"Du har redan gjort 4 försök att logga in och för att undvika ditt konto blockering, bör du vänta {time?.ToString("HH:mm:ss")}"
                });
            }
        }
        var errorMessage = "Felaktig lösenord.";

        UserCredentials.Fixing = null;
        try
        {
            if (_provider.AccessValidation(UserCredentials.Username, password))
            {
                UserCredentials.Password = password;
                UserCredentials.Attempt = 0;
                return new JsonResult(new { success = true });
            }
        }
        catch (Exception ex)
        {
            errorMessage = "Fel: " + ex?.InnerException?.Message ?? ex.Message;
        }

        UserCredentials.Attempt += 1;
        if (UserCredentials.Attempt == 3)
        {
            UserCredentials.Attempt = 0;
            UserCredentials.Fixing = DateTime.Now;
        }

        return new JsonResult(new { success = false, msg = errorMessage});
    }
    #endregion

    #region POST
    // Log in with another account if authentication with windows username is failed or to authorize another user
    [HttpPost]
    public JsonResult Post(LoginViewModel model)
    {
        if (!ModelState.IsValid)
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" }); //Forms filled out incorrectly
        try
        {
            var isAutheticated = _provider.AccessValidation(model.Username, model.Password);
            if (!isAutheticated)
                return new JsonResult(new { alert = "error", msg = "Felaktig användarnamn eller lösenord." }); //Incorrect username or password"

            if (_provider.MembershipCheck(model.Username))
            {
                var user = _provider.FindUserByName(model.Username);
                var token = CreateJwtToken(user);
                UserCredentials.Username = model.Username;
                UserCredentials.Password = model.Password;
                UserCredentials.Email = user.EmailAddress;
                UserCredentials.FullName = user.DisplayName;
                return new JsonResult(new { access = true, alert = "success", token = token, msg = "Din åtkomstbehörighet har bekräftats." }); // Your access has been confirmed.
            }
        }
        catch (Exception ex)
        {
            return new JsonResult(new { alert = "warning", msg = "Något har gått snett. Felmeddelande visas i browser konsolen.", consoleMsg = ex.Message }); //Something went wrong, please try again later
        }

        return new JsonResult(new { alert = "warning", msg = "Åtkomst nekad! Du har inte behörighet att redigera elevs lösenord" }); // Failed! You do not have permission to edit a student's password
    }
    #endregion

    #region Helpers
    // Create Jwt Token for authenticating
    private string CreateJwtToken(Principal user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
        IdentityOptions opt = new IdentityOptions();

        var claims = new List<Claim>();
        claims.Add(new Claim(ClaimTypes.Name, user.Name));
        claims.Add(new Claim("DisplayName", user.DisplayName));
        claims.Add(new Claim("Description", user.Description));
        //foreach (var r in roles)
        //    claim.Add(new Claim(opt.ClaimsIdentity.RoleClaimType, r));

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims.ToArray()),
            Expires = DateTime.Now.AddDays(3),
            SigningCredentials = credentials
        };

        var encodeToken = new JwtSecurityTokenHandler();
        var securityToken = encodeToken.CreateToken(tokenDescriptor);
        var token = encodeToken.WriteToken(securityToken);

        return token;
    }
    #endregion
}


public static class UserCredentials
{
    public static string? Username { get; set; }
    public static string? FullName { get; set; }
    public static string? Email { get; set; }
    public static string? Password { get; set; }
    public static int Attempt { get; set; }
    public static Nullable<DateTime> Fixing { get; set; }
}