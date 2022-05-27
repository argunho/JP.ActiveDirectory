using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Mail;

namespace Smaska_Gott.Repositories
{
    public class MailRepository
    {
        // Service params
        private string _url = "mail.hobbykocken.com";
        private string _mail = "hobbykocken@hobbykocken.com";
        private string _password = "HobbyKocken2021_";

        // Template params
        public static string header = "<div style='width:98%;overflow:hidden;display:block;border:2px solid #3B8506;margin:auto;background:#FFFFFF;font-family:Tahoma;'>" +
                                       "<div style='width:100%;height:140px;display:block;background:#3B8506;position:relative;'>" +
                                       "<a href='{link}' style='width:100%;display:block:height:auto;' target='_blank'><img src='{logo}' alt='' style='width:90%;max-width:400px;height:120px;margin:10px auto;' /></a></div>";
        public static string content = "<div style='width:auto;padding:20px;font-size:18px;display:block;'>{content}</div>";
        public static string footer = "<div style='width:96%;margin:20px 1%;display:block;padding:25px 1%;text-align:center;line-height:25px;" +
                                            "font-size:16px;border-top:2px solid #3B8506;'><div style='width:50%;min-width:320px;display:block;margin:auto;font-family:Franklin Gothic Medium;'>{footer}</div></div></div>";

        // Template Dictionary
        public static Dictionary<string, string> Templates = new Dictionary<string, string>
        {
            { "mail", header + content + footer }
        };

        // Send mail service
        public bool SendMail(string to, string title, string content, string contact = null)
        {
            var client = new SmtpClient(_url, 25)
            {
                Credentials = new NetworkCredential(_mail, _password),
                EnableSsl = false
            };

            //var mail = "<" + ((contact) ? _mail : "info@hobbykocken.com") + ">";   // Email must to have same password to login

            MailMessage mm = new MailMessage("HobbyKocken <" + _mail + ">", to, title, content);
            mm.IsBodyHtml = true;

            try
            {
                client.Send(mm);
                return true;
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.Message);
                return false;
            }
        }
    }
}
