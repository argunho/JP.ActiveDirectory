import { KeyboardReturnTwoTone } from '@mui/icons-material'
import { Button, List, ListItem, ListItemText, Typography } from '@mui/material'
import React from 'react'
import { useHistory } from 'react-router-dom'

export default function Info({ name, displayName, subTitle }) {
    const history = useHistory(null);

    // Print out user's info
    return (<List sx={{ width: '100%' }}>
        <ListItem className='search-result-reset'>
            {/* Users data */}
            <ListItemText
                primary={name}
                secondary={
                    <React.Fragment>
                        <Typography
                            sx={{ display: 'inline' }}
                            component="span"
                            variant="body2"
                            color="primary">
                            {displayName}
                        </Typography>
                        <span className='typography-span'>{subTitle}</span>
                    </React.Fragment>} />

            {/* Go back */}
            <Button
                variant="text"
                onClick={() => history.goBack()}
                title="Go back">
                <KeyboardReturnTwoTone />
            </Button>
        </ListItem>
    </List>
    )
}
