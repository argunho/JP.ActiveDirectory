

import React, { useEffect, useRef, useState } from 'react'
import {  Avatar, Button, Checkbox, List, ListItem,
    ListItemAvatar, ListItemText, Tooltip, Typography
} from '@mui/material'
import { DeleteSweep, Deselect, Password, SelectAll } from '@mui/icons-material';
import Loading from './Loading';
import loadImg from './../../images/search.gif';
import { useHistory } from 'react-router-dom';
import Response from './Response';
/* eslint-disable react-hooks/exhaustive-deps */  // <= Do not remove this line


export default function Result({ users, clsStudents, isResult, isVisibleTips, inProgress, response, group, cancelRequest, resetResult }) {

    const refResult = useRef(null);
    const [selectedList, setSelectedList] = useState([]);
    const [isOpenTip, setIsOpenTip] = useState(false);

    const history = useHistory();

    const ul = users.length;
    const sl = selectedList.length;
    const selected = (ul === sl);
console.log(group)

    useEffect(() => {
        refResult.current.scrollIntoView();
    }, [inProgress, isResult])

    useEffect(() => {
        if (isOpenTip)
            setTimeout(() => { setIsOpenTip(false); }, 2000)
    }, [isOpenTip])

    // To select all from class students list
    const selectList = (selected) => {
        const arr = [];
        if (!selected)
            users.forEach(u => { arr.push(u.name) });

        setSelectedList(arr);
        setIsOpenTip(arr.length > 0);
    }

    // Navigate to page
    const goTo = (name = null) => {
        // Save found result i sessionStorage
        sessionStorage.setItem("users", JSON.stringify(users));
        sessionStorage.setItem("selectedList", JSON.stringify(selectedList));
        sessionStorage.setItem("selectedUsers", JSON.stringify(users.filter(x => selectedList.some(s => s === x.name))));

        // Navigation
        history.push(name ? "/manage-user/" + name : `/manage-users/${users[0].department}/${users[0].office}`);
    }


    // To select one by one user from the class students' list
    const handleSelectedList = (name) => {
        const arr = selectedList;
        if (arr?.length > 0 && arr.indexOf(name) > -1)
            arr.splice(arr.indexOf(name), 1);
        else arr.push(name);

        // Update selected users
        setSelectedList(arr);
        setIsOpenTip(arr.length > 0);
    }

    return (
        /* Box to view the result of search */
        <div className='interior-div' ref={refResult}>
            {/* Result info box */}
            <ListItem className='search-result-reset'>
                {/* Result info */}
                <ListItemText
                    primary="Result"
                    secondary={inProgress ? "S??kning p??g??r ..." : (ul > 0 ? ("Hittades: " + ul + " anv??ndare")
                        : "Ditt s??kresultat kommer att visas h??r nedan")} />

                {clsStudents && ul > 0 ?
                    /* Hidden form to reset selected users password */
                    <Tooltip arrow
                        title={`Klicka h??r att st??lla in nytt l??senord f??r valda ${sl} elev${sl === 1 ? "" : "er"}`}
                        classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}
                        open={isOpenTip}>
                        <Button
                            disabled={sl === 0}
                            onMouseOver={() => setIsOpenTip(isVisibleTips)}
                            onMouseLeave={() => setIsOpenTip(false)}
                            onClick={() => goTo()}>
                            <Password />
                        </Button>
                    </Tooltip> : null}

                {/* Cancel request */}
                {inProgress ?
                    <Button variant='contained' color="error" onClick={() => cancelRequest()}>Avbryt s??kning</Button>
                    : null}

                {/* Button to reset search result */}
                <Tooltip arrow
                    disableHoverListener={!isVisibleTips}
                    title="Ta bort s??kresultat."
                    classes={{ tooltip: "tooltip tooltip-error", arrow: "arrow-error" }}>
                    <span>
                        <Button variant="text"
                            color="error"
                            onClick={() => resetResult()}
                            disabled={!isResult && ul === 0} >
                            <DeleteSweep /></Button>
                    </span>
                </Tooltip>
            </ListItem>

            {/* Visible image under search progress */}
            {inProgress ? <Loading msg="Var v??nlig och v??nta, s??kning p??g??r ..." img={loadImg} /> : null}

            {/* Select or deselect all users in class members list */}
            {clsStudents && ul > 0 ?
                /* Hidden form to reset selected users password */
                <List sx={{ width: '100%' }} component="nav">
                    {/* Select or deselect all list */}
                    <ListItem className='search-result-select'>
                        <ListItemAvatar>
                            <Avatar className="user-avatar">
                                {!selected ? <SelectAll /> : <Deselect color="primary" />}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${selected ? "Avmarkera" : "Markera"} alla`}
                            secondary={<React.Fragment>
                                <Typography
                                    sx={{ display: 'inline' }}
                                    component="span"
                                    variant="body2"
                                    color={sl > 0 ? "primary" : "inherit"}>
                                    {sl} elev{sl === 1 ? "" : "er"} har valts
                                </Typography>
                            </React.Fragment>}
                        />
                        <Checkbox
                            checked={selected}
                            onClick={() => selectList(selected)} />
                    </ListItem>
                </List> : null}

            {/* Loop of search result list if result is not null */}
            {users?.length > 0 ?
                <List sx={{ width: '100%' }}>
                    {users.map((s, index) => (
                        /* List object */
                        <ListItem key={index} className="list-link">

                            {/* Avatar */}
                            <ListItemAvatar>
                                <Avatar className="user-avatar">
                                    <img className={`${group}-avatar`} src={require(`./../../images/${group}.png`)} alt="unlock user" />
                                </Avatar>
                            </ListItemAvatar>

                            {/* User data */}
                            <ListItemText primary={s.name} onClick={() => goTo(s.name)}
                                secondary={<React.Fragment>
                                    <Typography
                                        sx={{ display: 'inline' }}
                                        component="span"
                                        variant="body2"
                                        color="primary"> {s.displayName} </Typography>
                                    <span className='typography-span'>{s.office + " " + s.department}</span>
                                </React.Fragment>} />

                            {/* Checkbox visible only if is success result after users search by class name */}
                            {clsStudents ? <Checkbox
                                size='small'
                                color="default"
                                checked={selectedList.indexOf(s.name) > -1}
                                onMouseDown={() => setIsOpenTip(false)}
                                onClick={() => handleSelectedList(s.name)} />
                                : null}
                        </ListItem>))}
                </List> : null}

            {/* Message if result is null */}
            {(isResult && ul === 0) ? <Response response={response} reset={() => resetResult()} /> : null}
        </div>
    )
}
