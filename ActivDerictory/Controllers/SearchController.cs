using ActiveDirectory.Extensions;
using ActiveDirectory.Interface;
using ActiveDirectory.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;

namespace ActiveDirectory.Controllers
{
    [Route("[controller]")]
    [ApiController]
    public class SearchController : ControllerBase
    {
        private readonly IActiveDirectoryProvider _provider;
        public SearchController(IActiveDirectoryProvider activeDirectory)
        {
            _provider = activeDirectory;
        }

        #region GET

        [HttpGet("user/{name}/{match:bool}/{capitalize:bool}")]
        [Authorize]
        public JsonResult FindUser(string name, bool match = false, bool capitalize = false)
        {
            List<User> users = new List<User>();
            try
            {
                var group = _provider.FindGroupName("Students");

                if (match)
                {
                    var members = group.GetMembers(true).Where(x => (!capitalize
                            ? (x.Name.ToLower().Contains(name) || x.DisplayName.ToLower().Contains(name))
                            : (x.Name.Contains(name) || x.DisplayName.Contains(name)))).ToList();

                    foreach (Principal p in members)
                    {
                        var user = _provider.FindUserByExtensionProperty(p.Name);
                        users.Add(new User
                        {
                            Name = user.Name,
                            DisplayName = user.DisplayName,
                            Office = user.Office,
                            Department = user.Department
                        });
                    }
                    group.Dispose();
                }
                else
                {
                    var member = group.GetMembers(true).FirstOrDefault(x => x.Name == name || x.DisplayName == name);
                    if (member == null) // Return if user not found.
                        return new JsonResult(new
                        {
                            warning = true,
                            msg = $"Användaren {name} hittades inte. Deta kan bli så att användaren {name} tillhör " +
                                        $"inte studentgruppen eller felstavat namn/användarnamn. " +
                                        $"Var vänlig, kontrollera namn/användarnam."
                        });

                    var user = _provider.FindUserByExtensionProperty(member.Name);
                    //_provider.MembershipCheck(name, "Students");

                    if (user != null)
                    {
                        users.Add(new User
                        {
                            Name = user.Name,
                            DisplayName = user.DisplayName,
                            Office = user.Office,
                            Department = user.Department
                        });
                    }
                }

                if (users.Count > 0)
                    return new JsonResult(new { users = users.OrderBy(x => x.Name) });

                return new JsonResult(new { msg = "Inga användarkonto hittades." });//No user was found
            }
            catch (Exception ex)
            {
                return Error(ex.Message);
            }
        }

        [HttpGet("members/{department}/{office}")]
        [Authorize]
        public async Task<JsonResult> FindClassMembers(string department, string office)
        {
            try
            {
                List<User> users = new List<User>();
                var context = _provider.GetContext();

                using (UserPrincipalExtension searchDepartment = new UserPrincipalExtension(context) { Department = String.Format("*{0}*", department) })
                using (PrincipalSearcher searcherDepartment = new PrincipalSearcher(searchDepartment))
                using (Task<PrincipalSearchResult<Principal>> taskDepartment = Task.Run<PrincipalSearchResult<Principal>>(() => searcherDepartment.FindAll()))
                {
                    foreach (UserPrincipalExtension member in (await taskDepartment))
                    {
                        using (member)
                        {
                            if (member.Office.ToLower() == office.ToLower())
                            {
                                users.Add(new User
                                {
                                    Name = member.Name,
                                    DisplayName = member.DisplayName,
                                    Department = member.Department,
                                    Office = member.Office,
                                    Title = member.Title
                                });
                            }
                        }
                    }
                }

                if (users.Count > 0)
                    return new JsonResult(new { users = users.Distinct().OrderBy(x => x.Name) });

                return new JsonResult(new { msg = "Inga användarkonto hittades. Var vänlig kontrollera klass- och skolnamn." });
            }
            catch (Exception ex)
            {
                return Error(ex.Message);
            }

        }
        #endregion

        #region Helpers
        public JsonResult Error(string msg) => new JsonResult(new { alert = "error", msg = "Något har gått snett. Felmeddelande visas i browser konsolen.", errorMsg = msg }); // Sommething went wrong.
        #endregion
    }
}