using ActiveDirectory.Extensions;
using ActiveDirectory.ViewModels;
using System.DirectoryServices.AccountManagement;


namespace ActiveDirectory.Interface;

public interface IActiveDirectoryProvider
{
    UserPrincipal FindUserByName(string name);
    UserPrincipalExtension FindUserByExtensionProperty(string name);
    GroupPrincipal FindGroupName(string name);
    List<Principal> GetUserSecurityGroups(string name);
    bool AccessValidation(string? name, string? password);
    bool MembershipCheck(string? username, string? groupname = "Password Reset Students-EDU");
    string ResetPassword(UserViewModel model);
    string UnlockUser(UserViewModel model);
    PrincipalContext GetContext();
}
