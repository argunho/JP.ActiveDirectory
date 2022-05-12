import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import Draggable from 'react-draggable';
import { AlertTitle, Checkbox, FormControlLabel } from '@mui/material';
import { Close, HelpOutline, LiveHelpOutlined } from '@mui/icons-material';

function PaperComponent(props) {
    return (
        <Draggable
            handle="#draggable-dialog-title"
            cancel={'[class*="MuiDialogContent-root"]'}>
            <Paper {...props} />
        </Draggable>
    );
}

export default function ModalHelpTexts({ arr, position }) {
    const [open, setOpen] = React.useState(false);

    return (
        <>
            <FormControlLabel
                className={'help-btn' + (position ? " situated-btn" : "")}
                control={<Checkbox size='small'
                    color="primary"
                    checked={open}
                    icon={<HelpOutline />}
                    checkedIcon={<LiveHelpOutlined/>}
                    onClick={() => setOpen(true)}
                    inputProps={{ 'aria-label': 'controlled', color: "primary" }} />}
                label="Hjälp" />

            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                PaperComponent={PaperComponent}
                aria-labelledby="draggable-dialog-title">
                <DialogTitle style={{ cursor: 'move' }} id="draggable-dialog-title">
                Förklaring av sökparametrar
                </DialogTitle>
                <DialogContent>
                    {arr.map((a, i) => (
                    <DialogContentText key={i} className="modal-tips">
                        <AlertTitle style={{fontWeight: 600 }}><span style={{color: (a?.color ? a.color : "#000")}}>{a.label}</span></AlertTitle>
                        <div dangerouslySetInnerHTML={{ __html: a.tip }}></div>
                    </DialogContentText>                        
                    ))}
                </DialogContent>
                <DialogActions>
                    <Button variant='outlined' color="error" autoFocus onClick={() => setOpen(false)}>
                        <Close />
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
