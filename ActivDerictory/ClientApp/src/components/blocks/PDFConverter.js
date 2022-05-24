import React from 'react';
import { Page, Text, View, Document, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';


// Create styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'row',
        backgroundColor: '#E4E4E4',
        paddingTop: 35,
        paddingBottom: 65,
        paddingHorizontal: 35
    },
    header: {
        fontSize: 12,
        marginBottom: 20,
        textAlign: "center",
        color: "#C8C8C8"
    },
    title: {
        fontSize: 24,
        textAlign: "center"
    },
    text: {
        margin: 12,
        fontSize: 14,
        textAlign: "justify",
        fontFamily: "Times-Roman"
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1
    },
    pagination: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 30,
        fontSize: 12, color: "#C8C8C8"
    }
});

function PDFDocument(props) {
    const keys = props?.content.length > 0 ? Object.keys(props.content[0]) : [];

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                    <Text style={styles.header} fixed dangerouslySetInnerHTML={{ _html: props?.title }}></Text>
                    {props?.content.map((c, i) => (
                        <div key={i} className={props.contentClass}>
                            <p style={{ fontWeight: 600 }}>
                                <span style={{ color: (c?.color ? c.color : "#000") }}>{c[keys[0]]}</span>
                            </p>
                            <div dangerouslySetInnerHTML={{ __html: c[keys[1]] }}></div>
                        </div>
                    ))}
                </View>
                <Text style={styles.pagination}
                    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}>
                </Text>
            </Page>
        </Document>
    )
}

// export default function PDFButtonLink(props) {
//     return (
//         <PDFDownloadLink document={<PDFDocument {...props} />} fileName="FORM">
//             {({ loading }) => (loading ? 'Obs' : "Save & Verkställ")}
//         </PDFDownloadLink>
//     )
// }

export default PDFDocument;