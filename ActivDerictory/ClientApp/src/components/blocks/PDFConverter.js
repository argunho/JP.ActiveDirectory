import React from 'react';
import { Button } from '@mui/material';
import { jsPDF } from "jspdf";

export default function PDFConverter({ name, subTitle, content }) {
    const regex = /(<([^>]+)>)/ig;

    const saveApply = () => {
        const doc = new jsPDF('p', 'pt', 'a4');

        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        // doc.setFontSize(15);
        // doc.text(name, 15, 5);
        //     if (defHeight >= pageHeight)
        //         doc.addPage();
        // for(let i;i < content.length;i++){
        //     doc.setFontSize(14);
        //     doc.text(content[i].displayName, 15, 70 + (15*i));
        //     // doc.setFontSize(12);
        //     // doc.html(c.password);
        // }


        doc.setFont("Times-Roman");
        doc.setFontSize(20);
        doc.text(name, 15, 50);

        doc.setFontSize(10)
        doc.setTextColor(12, 130, 51);
        doc.text(subTitle, pageWidth - 80, 10);

        let position = 90;
        for (let i = 0; i < content.length; i++) {
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text(content[i].displayName, 25, position);
            if (position > pageHeight) {
                doc.addPage();
                position = 15;
            }
            doc.setFontSize(9);
            doc.setTextColor(53, 53, 53);

            const pass = content[i].password.replace(regex, '').replaceAll(" ", "");
            doc.text(pass, 35, position + 5)
            if (position > pageHeight) {
                doc.addPage();
                position = 15;
            }
            position += 40;
        }

        doc.save(name + " " + subTitle + ".pdf");
    }

    return (
        <Button
            variant="text"
            color="inherit"
            className='button-btn'
            onClick={() => saveApply()}>
            Spara & Verkställ
        </Button>
    )
}