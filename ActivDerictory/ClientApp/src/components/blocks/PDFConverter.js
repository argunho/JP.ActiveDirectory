import React from 'react';
import { Button } from '@mui/material';
import { jsPDF } from "jspdf";
import 'jspdf-autotable'

export default function PDFConverter({ name, names, list, submit }) {
    const regex = /(<([^>]+)>)/ig;
    const keys = list.length > 0 ? Object.keys(list[0]) : [];

    const saveApply = () => {
        // const doc = new jsPDF('l', 'mm', [800, 801]);        
        const doc = new jsPDF('p', 'pt', 'a4');
        doc.setFontSize(20);
        doc.text(name.replaceAll(regex,""), 40, 50);

        doc.autoTable({
            margin: { top: 70 },
            headStyles: { fillColor: [31, 114, 47], cellPadding: 12 },
            bodyStyles: { cellPadding: 11 },
            columnStyles: { 2: {textColor: [208,66,66]} },
            html: "#list"
        });

        setTimeout(() => {
        doc.save(name.replaceAll(regex,"") + ".pdf");
        }, 100)

        submit();
        //     // Convert HTML to PDF in JavaScript
        //     const pdfContent = document.querySelector('#content');
        //     doc.html(pdfContent, {
        //         callback: function (pdf) {
        //             pdf.save(name + " " + subTitle + ".pdf");
        //         },
        //         x: 10,
        //         y: 10
        // });


        // const ps = doc.internal.pageSize;
        // const pageHeight = ps.height;
        // const pageWidth = ps.width;
        // doc.setFont("Times-Roman");
        // doc.setFontSize(20);
        // doc.text(name, 15, 50); 
        // doc.setFontSize(10)
        // doc.setTextColor(12, 130, 51);
        // doc.text(subTitle, pageWidth - 80, 10);

        // let position = 90;
        // for (let i = 0; i < content.length; i++) {
        //     doc.setFontSize(12);
        //     doc.setTextColor(0);
        //     doc.text(content[i].displayName, 25, position);
        //     if (position > pageHeight) {
        //         doc.addPage();
        //         position = 15;
        //     }
        //     doc.setFontSize(9);
        //     doc.setTextColor(53, 53, 53);

        //     doc.text(content[i].password, 35, position + 5)
        //     if (position > pageHeight) {
        //         doc.addPage();
        //         position = 15;
        //     }
        //     position += 40;
        // }
    }

    return (
        <>
            {/* Table to print */}
            <table className="table hidden-content" id="list">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        {names.map((n, i) => (  <th scope="col" key={i}>{n}</th> ))}
                    </tr>
                </thead>
                <tbody>
                    {list.map((l, ind) => (
                        <tr key={ind}>
                            <th scope="row">{ind + 1}</th>
                            <td>{l[keys[0]]}</td>
                            <td>{l[keys[2]]}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Click button to download pdf */}
            <Button
                variant="text"
                color="inherit"
                className='button-btn'
                onClick={() => saveApply()}>
                Spara & Verkställ
            </Button>
        </>
    )
}