using ActivDerictory.ViewModels;
using ActiveDirectory.Interface;
using ActiveDirectory.Models;
using ActiveDirectory.Repositories;
using ActiveDirectory.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;

namespace ActiveDirectory.Controllers;

[Route("[controller]")]
[ApiController]
[Authorize]
public class UserController : ControllerBase
{

    private readonly IActiveDirectoryProvider _provider; // Implementation of interface, all interface functions are used and are called from the file => ActiveDerictory/Repository/ActiveProviderRepository.cs
    public UserController(IActiveDirectoryProvider provider)
    {
        _provider = provider;
    }

    #region GET
    [HttpGet("{name}")] // Get user information by username
    public JsonResult GetUser(string name)
    {
        var user = _provider.FindUserByExtensionProperty(name);
        var userData = new User
        {
            Name = user.Name,
            DisplayName = user.DisplayName,
            Office = user.Office,
            Department = user.Department,
            IsLocked = user.IsAccountLockedOut(),
            Date = user.AccountLockoutTime
        };

        return new JsonResult(new { user = userData });
    }
    #endregion

    #region POST
    [HttpPost("resetPassword")] // Reset one student password
    public JsonResult ResetPasword(UserViewModel model)
    {
        // Check model is valid or not and return warning is true or false
        var warning = ReturnWarningsMessage(model);
        if (warning != null)
            return warning;

        // Set password to one student
        return ReturnResultMessage(_provider.ResetPassword(UpdatedUser(model)));
    }

    [HttpPost("setPasswords")] // Set password to class students
    public JsonResult SetMultiplePaswords(UserViewModel model)
    {
        // Check model is valid or not and return warning is true or false
        var warning = ReturnWarningsMessage(model);
        if (warning != null)
            return warning;
        string message = string.Empty;

        // Set password to class students
        foreach (var user in model.Users)
            message += _provider.ResetPassword(UpdatedUser(user));

        return ReturnResultMessage(message);
    }

    [HttpPost("unlock")] // Unlock user
    public JsonResult UnlockUser(UserViewModel model)
    {
        var message = _provider.UnlockUser(UpdatedUser(model));
        if (message.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });

        return new JsonResult(new { success = true, unlocked = true, alert = "success", msg = "Användaren har låsts upp!" });
    }

    [HttpPost("mail/{str}")] // Send email to admin
    public JsonResult SendEmail(string str, IFormFile attachedFile)
    {
        try
        {
            var _session = HttpContext.Session;
            MailRepository ms = new MailRepository(); // Implementation of MailRepository class where email content is structured and SMTP connection with credentials

            string mail = _session.GetString("Email") ?? String.Empty;
            var success = ms.SendMail(mail, "Lista över nya lösenord till " + str + " elever",
                        $"Hej {_session.GetString("FullName")}!<br/> Här bifogas PDF document filen med nya lösenord till elever från klass {str}.",
                        _session.GetString("Email") ?? "", _session.GetString("Password") ?? "", attachedFile);
            if (!success)
                return new JsonResult(new { alert = "warning", msg = $"Det gick inte att skicka e-post med pdf dokument till e-postadress {mail}", errorMessage = MailRepository._message });
        }
        catch (Exception ex)
        {
            return new JsonResult(new { alert = "warning", msg = "Fel vid försök att skicka e-post med pdf dokument.", errorMessage = ex.Message });
        }

        return new JsonResult(new { result = true });
    }

    [HttpPost("contact/{error}")] // Send email to support
    [AllowAnonymous]
    public JsonResult SendEmailToSupport(string error)
    {

        var model = new ContactViewModel
        {
            Title = "Unlock User : Felmeddelande",
            Text = error
        };
        MailRepository ms = new MailRepository();
        var success = ms.SendContactEmail(model);
        return new JsonResult(true);
    }
    #endregion

    #region Helpers
    // Help method to structure a warning message
    public JsonResult? ReturnWarningsMessage(UserViewModel model)
    {
        if (!ModelState.IsValid)
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" }); // Forms filled out incorrectly
        else if (model.Password != model.ConfirmPassword)
            return new JsonResult(new { alert = "warning", msg = "Fällts för Lösenord och Bekräfta lösenord matchar inte" }); // Password and ConfirmPassword doesn't matchs
        else if (model.Name == null && model.Users.Count() == 0)
            return new JsonResult(new { alert = "warning", msg = "Användare för lösenordsåterställning har inte specificerats." }); // Password reset user not specified

        return null;
    }

    // Help method to structure a result message
    public JsonResult ReturnResultMessage(string? message)
    {
        if (message?.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });

        return new JsonResult(new { success = true, alert = "success", msg = "Lösenordsåterställningen lyckades!" }); //Success! Password reset was successful!
    }

    // Return extension of User
    public UserViewModel UpdatedUser(UserViewModel user)
    {
        var claims = User.Claims.ToList();

        // Get password token and decode encoded password
        byte[] passwordBytes = Convert.FromBase64String(claims.FirstOrDefault(x => x.Type == "Password")?.Value ?? "");
        var reversedPassword = Encoding.Default.GetString(passwordBytes).ToArray();
        Array.Reverse(reversedPassword);
        string decodedPassword = string.Join("", reversedPassword);

        user.Credentials = new UserCredentials();
        user.Credentials.Username = claims.FirstOrDefault(x => x.Type == "Email")?.Value ?? "";
        user.Credentials.Password = decodedPassword;

        return user;
    }
    #endregion
}
