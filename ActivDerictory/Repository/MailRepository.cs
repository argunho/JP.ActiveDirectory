using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Mail;

namespace ActiveDirectory.Repositories;

public class MailRepository
{
    // Template params
    public static string header = "<div style='width:98%;overflow:hidden;display:block;border:1px solid #3B8506;margin:auto;background:#FFFFFF;font-family:Tahoma;'>" +
                                   "<div style='display:block;width:100%;height:100px;padding:25px 0'>" +
                                    "<a style='float:left;font-size:20px' href='https://alvesta.se' target='_blank'>" +
                                    "<img alt='Alvesta Kommun' style='width:70px;margin: 30px' src='https://www.alvesta.se/assets/images/framework/Alvesta.svg'/></a></div>";
    public static string content = "<div style='width:auto;padding:20px;font-size:18px;display:block;'>{content}</div>";
    public static string footer = "<div style='width:96%;margin:20px 1%;display:block;padding:25px 1%;text-align:center;line-height:25px;" +
                                        "font-size:16px;border-top:2px solid #3B8506;'><div style='width:50%;min-width:320px;display:block;margin:auto;font-family:Franklin Gothic Medium;'>{footer}</div></div></div>";

    // Template Dictionary
    public static Dictionary<string, string> Templates = new Dictionary<string, string>
    {
        { "mail", header + content + footer }
    };
    // Send mail service
    public bool SendMail(string to, string title, string content, string fromMail, string mailPassword, IFormFile? attachedFile = null)
    {
        var _smtp = "smtp.alvesta.local";
        var client = new SmtpClient(_smtp, 25)
        {
            Credentials = new NetworkCredential(fromMail, mailPassword),
            EnableSsl = false
        };

        //var mail = "<" + ((contact) ? _mail : "info@hobbykocken.com") + ">";   // Email must to have same password to login

        MailMessage mail = new MailMessage("Unlock User Alvesta Kommun <" + fromMail + ">", to, title, content);
        mail.IsBodyHtml = true;
        if (attachedFile != null)
            mail.Attachments.Add(new Attachment(attachedFile.OpenReadStream(), title + "." + attachedFile.ContentType.Substring(attachedFile.ContentType.IndexOf("/") + 1)));

        try
        {
            client.Send(mail);
            return true;
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return false;
        }
    }
}
