using UnlockUser.Extensions;
using UnlockUser.ViewModels;
using System.DirectoryServices.AccountManagement;


namespace UnlockUser.Interface;

public interface IActiveDirectoryProvider
{
    UserPrincipal FindUserByName(string name);
    UserPrincipalExtension FindUserByExtensionProperty(string name);
    GroupPrincipal FindGroupName(string name);
    bool AccessValidation(string? name, string? password);
    bool MembershipCheck(string? username, string? groupname);
    string ResetPassword(UserViewModel model);
    string UnlockUser(UserViewModel model);
    PrincipalContext GetContext();
}
