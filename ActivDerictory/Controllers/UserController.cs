using ActiveDirectory.Interface;
using ActiveDirectory.Models;
using ActiveDirectory.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ActiveDirectory.Controllers;

[Route("[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly IActiveDirectoryProvider _provider;
    public UserController(IActiveDirectoryProvider activeDirectory)
    {
        _provider = activeDirectory;
    }

    #region GET
    [HttpGet("{name}")]
    [Authorize]
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
    [HttpPost("resetPassword")]
    [Authorize]
    public JsonResult ResetPasword(UserViewModel model)
    {
        var warning = ReturnWarningsMessage(model);
        if (warning != null)
            return warning;

       return ReturnResultMessage(_provider.ResetPassword(model));
    }

    [HttpPost("setPasswords")]
    [Authorize]
    public JsonResult SetMultiplePaswords(UserViewModel model)
    {
        var warning = ReturnWarningsMessage(model);
        if (warning != null)
            return warning;
        string message = string.Empty;
        //foreach (var user in model.Users)
        //    message += _provider.ResetPassword(user);

        return ReturnResultMessage(message);
    }

    [HttpPost("unlock")]
    [Authorize]
    public JsonResult UnlockUser(UserViewModel model)
    {
        var message = _provider.UnlockUser(model);
        if (message.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });

        return new JsonResult(new { success = true, unlocked = true, alert = "success", msg = "Användaren har låsts upp!" }); // Success! User unlocked successfully!
    }
    #endregion
    
    #region Helpers
    public JsonResult ReturnWarningsMessage(UserViewModel model)
    {
        if (!ModelState.IsValid)
            return new JsonResult(new { alert = "warning", msg = "Felaktigt eller ofullständigt ifyllda formulär" }); // Forms filled out incorrectly
        else if (model.Password != model.ConfirmPassword)
            return new JsonResult(new { alert = "warning", msg = "Fällts för Lösenord och Bekräfta lösenord matchar inte" }); // Password and ConfirmPassword doesn't matchs
        else if(model.Name == null && model.Users.Count() == 0)
            return new JsonResult(new { alert = "warning", msg = "Användare för lösenordsåterställning har inte specificerats." }); // Password reset user not specified

        return null;
    }

    public JsonResult ReturnResultMessage(string? message)
    {
        if (message?.Length > 0)
            return new JsonResult(new { alert = "warning", msg = message });

        return new JsonResult(new { success = true, alert = "success", msg = "Lösenordsåterställningen lyckades!" }); //Success! Password reset was successful!
    }
    #endregion
}
