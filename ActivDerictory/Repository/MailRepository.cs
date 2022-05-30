﻿using ActiveDirectory.Controllers;
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
    public static string mailHtml = "<!DOCTYPE html><html><body>" +
                                   "<div style=\"width:98%;overflow:hidden;display:block;border:1px solid #D8D8D8;margin:auto;background:#FFFFFF;font-family:Tahoma;\">" +
                                   "<div style=\"display:block;width:100%;height:100px;padding:25px 0\">" +
                                   "<a style=\"float:left;font-size:20px\" href='https://alvesta.se' target='_blank'>" +
                                   "<img alt='Alvesta Kommun' style='width:70px;margin: 30px' src='https://www.alvesta.se/assets/images/framework/Alvesta.svg'/></a></div>" +
                                   "<div style=\"width:auto;padding:35px;font-size:14px;display:block;\">{content}</div>" +
                                   "<div style=\"width:96%;margin:20px 1%;display:block;padding:25px 1%;text-align:center;line-height:25px;font-size:16px;border-top:1px solid #D8D8D8;display:flex;justify-content:center;\">" +
                                   "<div style=\"width:50%;min-width:320px;display:block;margin:auto;font-family:Franklin Gothic Medium;\">{footer}</div></div></div>" +
                                   "</body></html>";

    // Template Dictionary
    public static Dictionary<string, string> Templates = new Dictionary<string, string>
    {
        { "mail", mailHtml }
    };

    // Send mail service
    public bool SendMail(string toEmail, string mailSubject, string mailContent, IFormFile? attachedFile = null)
    {
        try
        {
            MailMessage _mail = new MailMessage(new MailAddress("no.reply@alvesta.se", "Unlock User"), new MailAddress(toEmail));
            _mail.Subject = mailSubject;
            _mail.Body = mailHtml.Replace("{content}", mailContent).Replace("{footer}", "Alvesta Kommun");
            _mail.IsBodyHtml = true;
            if (attachedFile != null)
                _mail.Attachments.Add(new Attachment(attachedFile.OpenReadStream(), mailSubject + "." 
                        + attachedFile.ContentType.Substring(attachedFile.ContentType.IndexOf("/") + 1)));

            SmtpClient _smtp = new SmtpClient();
            _smtp.Host = "smtp.alvesta.local";
            _smtp.Port = 25;
            _smtp.EnableSsl = false;
            _smtp.DeliveryMethod = SmtpDeliveryMethod.Network;

            NetworkCredential credential = new NetworkCredential();
            credential.UserName = AccessCredentials.Email;
            credential.Password = AccessCredentials.Password;
            _smtp.UseDefaultCredentials = false;
            _smtp.Credentials = credential;

            _smtp.Send(_mail);
            return true;
        }
        catch (Exception ex)
        {
            Debug.WriteLine(ex.Message);
            return false;
        }
    }
}
