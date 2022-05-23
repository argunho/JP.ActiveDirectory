﻿using ActiveDirectory.Controllers;
using ActiveDirectory.Extensions;
using ActiveDirectory.Interface;
using ActiveDirectory.ViewModels;
using System.DirectoryServices.AccountManagement;

namespace ActiveDirectory.Repository;

public class ActiveDirectoryProvider : IActiveDirectoryProvider
{
    private string domain = "alvesta";
    private string defaultOU = "DC=alvesta,DC=local";


    #region Interface methods
    public UserPrincipal FindUserByName(string name)
        => UserPrincipal.FindByIdentity(PContext(), name);

    public UserPrincipalExtension FindUserByExtensionProperty(string name)
        => UserPrincipalExtension.FindByIdentity(PContext(), name);

    public GroupPrincipal FindGroupName(string name)
        => GroupPrincipal.FindByIdentity(PContext(), name);

    public bool AccessValidation(string? name, string? password = null)
        => PContext().ValidateCredentials(name, password);

    // Check user's membership in a specific group in which members have access  to change student password 
    public bool MembershipCheck(string username, string groupname = "Password Reset Students-EDU")
    {
        var userPrincipal = FindUserByName(username);
        if (userPrincipal == null) // User does not exist.
            return false;

        List<Principal> groups = userPrincipal.GetAuthorizationGroups().ToList();

        return groups.Find(x => x.Name == groupname) != null;
    }

    public PrincipalContext GetContext() => PContext();

    public string ResetPassword(UserViewModel model)
    {
        try
        {
            using (var context = PContexAccessCheck())
            {
                using (AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Name))
                {
                    if (user == null)
                        return $"Avbrott i processen. Användaren {model.Name} hittades inte"; // Canceled operation. User {model.Name} not found

                    user.SetPassword(model.Password);
                    user.Dispose();
                }
            }
        }
        catch (Exception ex)
        {
            return "Fel: " + ex?.InnerException?.Message ?? ex.Message;
        }

        return string.Empty;
    }

    public string UnlockUser(UserViewModel model)
    {
        using (var context = PContexAccessCheck())
        {
            using (AuthenticablePrincipal user = UserPrincipal.FindByIdentity(context, model.Name))
            {
                if (user == null)
                    return "Användaren hittades inte."; // User not found
                try
                {
                    if (!user.IsAccountLockedOut())
                        user.UnlockAccount();
                    else
                        return "Avbrott i processen. Användarkontot är inte blockerat.";// The process is cancelled! The user's account is not locked!

                    user.Save();
                }
                catch (Exception ex)
                {
                    return "Fel: " + ex.Message;
                }
            }
        }
        return string.Empty;
    }

    #endregion

    #region Helpers
    public PrincipalContext PContext() =>
        new PrincipalContext(ContextType.Domain, domain, defaultOU);


    public PrincipalContext PContexAccessCheck() 
        => new PrincipalContext(ContextType.Domain, domain, defaultOU, AccessCredentials.Username, AccessCredentials.Password);
    #endregion
}
