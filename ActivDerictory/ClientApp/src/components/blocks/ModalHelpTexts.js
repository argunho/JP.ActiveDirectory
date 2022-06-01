import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { AlertTitle, Checkbox, FormControlLabel } from '@mui/material';
import { Close, HelpOutline, LiveHelpOutlined } from '@mui/icons-material';
import Table from './Table';


function PaperComponent(props) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
}

function ModalHelpTexts({ arr, cls = " situated-btn", isTable = false, isSubmit = false,
    title = "Förklaring av sökparametrar", inverseFunction }, ref) {

    const [open, setOpen] = React.useState(false);

    const keys = arr.length > 0 ? Object.keys(arr[0]) : [];
    const refPrint = React.useRef(null);

    const clickHandle = (save) => {
        inverseFunction(save);
        setOpen(false);
    }

    return (
        <>
            <FormControlLabel
                className={'help-btn' + cls}
                control={<Checkbox size='small'
                    color="primary"
                    checked={open}
                    ref={ref}
                    icon={<HelpOutline />}
                    checkedIcon={<LiveHelpOutlined />}
                    onClick={() => setOpen(true)}
                    inputProps={{ 'aria-label': 'controlled', color: "primary" }} />}
                label="Hjälp" />

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title"
                className='modal-wrapper print-page' id="content"
                ref={refPrint}>

                <DialogTitle
                    style={{ cursor: 'move' }}
                    id="draggable-dialog-title"
                    dangerouslySetInnerHTML={{ __html: title }}>
                </DialogTitle>

                <DialogContent style={{ marginBottom: "25px" }}>
                    {isTable ? <Table
                        name={title}
                        names={["Namn", "Lösenord"]} list={arr} />
                        : arr.map((a, i) => (
                            <div key={i} className="modal_content">
                                <AlertTitle style={{ fontWeight: 600 }}>
                                    <span style={{ color: (a?.color ? a.color : "#000") }}>{a[keys[0]]}</span>
                                </AlertTitle>
                                <div dangerouslySetInnerHTML={{ __html: a[keys[1]] }}></div>
                            </div>
                        ))}
                </DialogContent>

                <DialogActions style={{ position: "relative", overflow: "hidden" }} className="no-print">
                    {isSubmit ?
                        <>
                            <Button variant="text"
                                className='button-btn'
                                color="primary"
                                onClick={() => clickHandle(true)}>
                                Spara & Verkställ</Button>

                            <Button variant="outlined"
                                className='button-btn'
                                color="primary"
                                onClick={() => clickHandle(false)}>
                                Verkställ</Button>
                        </>
                        : null}
                    <Button variant='outlined' color="error" autoFocus onClick={() => setOpen(false)}>
                        <Close />
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
}

const refModal = React.forwardRef(ModalHelpTexts);
export default refModal;
