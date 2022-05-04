import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import loadImg from './../images/search.gif'
import Loading from './Loading'
import user from './../images/student.png'
import axios from 'axios'
import Form from './Form'
import HelpTexts from './HelpTexts'
import {
    DeleteSweep, Deselect, Password, SearchOffSharp, SearchSharp,
    SelectAll, ExpandLess, ExpandMore, InfoOutlined, InfoSharp
} from '@mui/icons-material'
import {
    Alert, Avatar, Button, Checkbox, Collapse, FormControl,
    FormControlLabel, List, ListItem, ListItemAvatar,
    ListItemButton, ListItemIcon, Tooltip,
    ListItemText, Radio, RadioGroup, TextField, Typography
} from '@mui/material'



export class Search extends Component {
    static displayName = Search.name;

    constructor(props) {
        super(props);

        this.state = {
            keyword: "",
            extraKeyword: "",
            users: JSON.parse(sessionStorage.getItem("users")) || [],
            inProgress: false,
            isResult: false,
            sParams: [
                { label: "Änvändare", value: "user" },
                { label: "Klass elever", value: "members" }
            ],
            sParam: sessionStorage.getItem("sParam") || "user",
            choiceList: [
                { label: "Match", match: true },
                { label: "Exakt", match: false }
            ],
            clMembers: sessionStorage.getItem("sParam") === "members",
            match: true,
            msg: "",
            showTips: false,
            warning: false,
            alert: "warning",
            capitalize: false,
            selectedUsers: [],
            open: false,
            helpTexts: [
                { label: "Änvändare", value: "user", tip: "Det här alternativet är till för att söka efter en specifik användare. Välj rätt sökalternativ nedan för att få den förväntande resultat." },
                { label: "Klass elever", value: "members", tip: "Det här alternativet är till för att söka efter alla elever i en specifik klass med klass- och skolnamn." },
                { label: "Versal", value: "capitalize", tip: "Matchning med exakt stavat namn. Resultatet kan ge 0 eller 1 hittade användare." },
                { label: "Match", value: "match", tip: "Matchningen av det angivna sökord bland alla elevers namn/användarnamn. Resultatet kan vara från 0 till ett obestämt antal hittade användare." },
                { label: "Exakt", value: "exact", tip: "Matchning med exakt stavat namn. Resultatet kan ge 0 eller 1 hittade användare." }
            ]
        }

        this.reset = this.reset.bind(this);
        this.checkboxHandle = this.checkboxHandle.bind(this);
        this.handleSelectedList = this.handleSelectedList.bind(this);
        this.selectList = this.selectList.bind(this);
        this.setSearchParameter = this.setSearchParameter.bind(this);

        this.refResult = React.createRef(null);
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");

        if (token === null || token === undefined)
            this.props.history.push("/");
        else if (this.props.history.action === "POP")
            sessionStorage.removeItem("users");
    }

    valueChangeHandler = e => {
        if (!e.target) return;
        const inp = e.target;

        this.setState({
            [inp.name]: (inp.type === "radio") ? inp.value === "true"
                : (this.state.match && this.state.capitalize ? (inp.value.charAt(0).toUpperCase() + inp.value.slice(1)) : inp.value),
            isResult: false,
            users: [],
            warning: false
        })
    }

    checkboxHandle = (capitalize) => {
        const { keyword, match } = this.state
        this.setState({
            keyword: (match && capitalize) ? (keyword.charAt(0).toUpperCase() + keyword.slice(1)) : keyword.toLowerCase(),
            capitalize: capitalize,
            isResult: false,
            users: [],
            warning: false
        })

        sessionStorage.removeItem("users");
    }

    handleKeyDown = (e) => {
        if (e.key === 'Enter') this.getSearchResult.bind(this);
    }

    returnToolTipByKeyword(keyword) {
        if (!this.state.showTips) return "";
        return this.state.helpTexts.find(x => x.label === keyword)?.tip;
    }


    handleSelectedList = (name) => {
        const arr = this.state.selectedUsers;
        if (arr?.length > 0 && arr.indexOf(name) > -1)
            arr.splice(arr.indexOf(name), 1);
        else
            arr.push(name);

        this.setState({ selectedUsers: arr });
    }

    selectList = (selected) => {
        const arr = [];
        if (!selected)
            this.state.users.forEach(u => { arr.push(u.name) });

        this.setState({ selectedUsers: arr })

    }

    setSearchParameter = value => {

        this.setState({
            sParam: value,
            users: [],
            isResult: false,
            match: this.state.clMembers,
            clMembers: !this.state.clMembers
        })
        sessionStorage.setItem("sParam", value)
    }

    goTo = (name) => {
        sessionStorage.setItem("users", JSON.stringify(this.state.users));
        this.props.history.push("/manage-user/" + name);
    }

    reset = () => {
        this.setState({ users: [], isResult: false });
        sessionStorage.removeItem("users");
    }
    
    // Submit function
    async getSearchResult(e) {
        e.preventDefault();

        const _config = {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem("token")}` }
        };

        this.refResult.current.scrollIntoView();
        this.setState({ inProgress: true, users: [], isResult: false });
        const { keyword, match, capitalize, sParam, extraKeyword, clMembers } = this.state;

        if (keyword.length < 2) return;

        const params = (!clMembers) ? match + "/" + capitalize : extraKeyword;

        await axios.get("search/" + sParam + "/" + keyword + "/" + params, _config).then(res => {
            const { warning, msg, users, errorMsg, alert } = res.data;
            setTimeout(() => {
                this.setState({
                    users: users || [],
                    inProgress: false,
                    isResult: true,
                    keyword: users?.length > 0 ? "" : keyword,
                    extraKeyword: users?.length > 0 ? "" : extraKeyword,
                    warning: warning,
                    msg: msg,
                    alert: (alert) ? alert : this.state.alert
                })
                this.refResult.current.scrollIntoView();
            }, 100);
            if (errorMsg) console.warn(errorMsg)
        }, error => {
            if (error.response.status === 401) {
                this.setState({
                    msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
                    alert: "error",
                    isResult: true,
                    inProgress: false
                })
                setTimeout(() => {
                    this.props.history.push("/");
                }, 3000)
            } else
                console.warn(error.response)
        });
    }

    render() {
        const { keyword, users, inProgress,
            isResult, choiceList, match, msg, warning,
            alert, capitalize, sParam, sParams, showTips,
            clMembers, selectedUsers, open, helpTexts } = this.state;
        const inputActive = keyword.length > 1;
        const isSuccess = users.length > 0;
        const sFormParams = !clMembers ? [{ name: "keyword", label: "Namn" }]
            : [{ name: "keyword", label: "Klassnamn", clsName: "search-first-input" },
            { name: "extraKeyword", label: "Skola", clsName: "search-second-input" }];

        const selected = selectedUsers.length === users.length;

        return (
            <div className='intorior-div' onSubmit={this.getSearchResult.bind(this)}>
                {/* Search form */}
                <form className='search-wrapper'>
                    {/* List loop of text fields */}
                    {sFormParams.map((s, index) => (
                        <TextField
                            key={index}
                            name={s.name}
                            label={s.label}
                            value={this.state[s.name]}
                            className={s.clsName || 'search-input'}
                            error={warning}
                            required
                            inputProps={{
                                maxLength: 30,
                                minLength: 2
                                // autoComplete: this.state[s.name],
                                // form: { autoComplete: 'off', }
                            }}
                            disabled={inProgress}
                            placeholder="Min 2 & Max 30 tecken ..."
                            onKeyDown={this.handleKeyDown}
                            onChange={this.valueChangeHandler} />))}

                    {inputActive ? <Button
                        variant="text"
                        color="error"
                        className="search-reset"
                        disabled={inProgress}
                        onClick={() => this.setState({ keyword: "", extraKeyword: "" })}>
                        <SearchOffSharp />
                    </Button> : null}
                    <Button
                        variant={inputActive ? "contained" : "outlined"}
                        color={inputActive ? "primary" : "inherit"}
                        className="search-button"
                        type="submit"
                        disabled={!inputActive || inProgress}>
                        <SearchSharp /></Button>
                </form>

                {/* The search paramters to choise */}
                <div className="checkbox-radio-wrapper">
                    
                    {/* Checkbox and radio to choice one of search alternatives */}
                    <FormControl style={{ display: "block" }}>
                        <RadioGroup row
                            name="row-radio-buttons-group">
                            {/* Checkbox */}
                            <FormControlLabel
                                control={<Checkbox size='small'
                                    checked={showTips}
                                    icon={<InfoOutlined />}
                                    checkedIcon={<InfoSharp />}
                                    onClick={() => this.setState({ showTips: !showTips })} />}
                                label={`${showTips ? "Dölj" : "Visa"}  hjälptexter`} />

                            {/* Loop of radio input choices */}
                            {sParams.map((p, index) => (
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={this.returnToolTipByKeyword(p.label)} classes={{ tooltip: "tooltip tooltip-green", arrow: "arrow-green" }}>
                                    <FormControlLabel
                                        value={sParam === p.value}
                                        control={<Radio
                                            size='small'
                                            checked={sParam === p.value}
                                            color="success" />}
                                        label={p.label}
                                        name="sParam"
                                        onChange={() => this.setSearchParameter(p.value)} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl>

                    {/* Checkbox and radio with search parameters to choose for user search */}
                    <FormControl>
                        <RadioGroup row
                            name="row-radio-buttons-group" >
                            
                            {/* Checkbox */}
                            <Tooltip arrow disableHoverListener={!showTips} classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}
                                title={this.returnToolTipByKeyword("Versal")} >
                                <FormControlLabel
                                    control={<Checkbox size='small'
                                        checked={capitalize && match}
                                        name="capitalize"
                                        disabled={!match || clMembers}
                                        onClick={() => this.checkboxHandle(!capitalize)} />}
                                    label="Versal" />
                            </Tooltip>

                            {/* Loop of radio input choices */}
                            {choiceList.map((c, index) => (
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={this.returnToolTipByKeyword(c.label)} classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}>
                                    <FormControlLabel
                                        value={c.match}
                                        control={<Radio
                                            size='small'
                                            checked={match === c.match}
                                            disabled={clMembers} />}
                                        label={c.label}
                                        name="match"
                                        onChange={this.valueChangeHandler} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl>
                </div>

                {/* Drop-down list with help texts */}
                <HelpTexts arr={helpTexts} />

                {/* Box to view the result of search */}
                <div className='intorior-div' ref={this.refResult}>
                    {/* Result info box */}
                    <ListItem className='search-result-reset'>
                        {/* Result info */}
                        <ListItemText
                            primary="Result"
                            secondary={isSuccess ? ("Hittades: " + users.length + " anvädare")
                                : "Ditt sökresultat kommer att visas här nedan"} />

                        {/* Button to reset search result */}
                        <Tooltip arrow disableHoverListener={!showTips} title="Ta bort sök resultat." classes={{ tooltip: "tooltip tooltip-error", arrow: "arrow-error" }}>
                            <span>
                                <Button variant="text"
                                    color="error"
                                    onClick={this.reset}
                                    disabled={!isResult && users.length === 0} ><DeleteSweep /></Button>
                            </span>
                        </Tooltip>
                    </ListItem>

                    {/* Visible image under search progress */}
                    {inProgress ? <Loading msg="Var vänlig och vänta, sökning pågår ..." img={loadImg} /> : null}

                    {/* Select or deselect all users in class members list */}
                    {clMembers && users.length > 0 ?
                        /* Hidden form to reset selected users password */
                        <List sx={{ width: '100%' }} component="nav">
                            {/* Form description */}
                            <ListItemButton onClick={() => this.setState({ open: !open })}
                                className={open && selectedUsers.length > 0 ? "dropdown-list-active" : ""}
                                disabled={selectedUsers.length === 0}>
                                <ListItemIcon> <Password /> </ListItemIcon>
                                <ListItemText primary={`Ställ in nytt lösenord för valda ${selectedUsers.length} användare`} />
                                {(open) ? <ExpandLess /> : <ExpandMore />}
                            </ListItemButton>

                            {/* Form wrapper, the user has to click on to open a hidden form if this selected user's count is more than 0 */}
                            <Collapse in={open} timeout="auto" unmountOnExit>
                                <Form list={selectedUsers}
                                    title={"Nytt lösenord"}
                                    api="setPasswords"
                                    buttonText="Verkställ" />
                            </Collapse>

                            {/* Select or deselect all list */}
                            <ListItem className='search-result-select'>
                                <ListItemAvatar>
                                    <Avatar className='user-avatar'>
                                        {!selected ? <SelectAll /> : <Deselect color="primary" />}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={`${selected ? "Avmarkera" : "Markera"} alla`} />
                                <Checkbox
                                    checked={selected}
                                    disabled={open}
                                    onClick={() => this.selectList(selected)} />
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
                                        <Avatar className='user-avatar'>
                                            <img className="user-avatar" src={user} alt="user" />
                                        </Avatar>
                                    </ListItemAvatar>

                                    {/* User data */}
                                    <ListItemText primary={s.name} onClick={() => this.goTo(s.name)}
                                        secondary={<React.Fragment>
                                            <Typography
                                                sx={{ display: 'inline' }}
                                                component="span"
                                                variant="body2"
                                                color="primary"> {s.displayName} </Typography>
                                            <span className='typography-span'>{s.office + " " + s.department}</span>
                                        </React.Fragment>} />

                                    {/* Checkbox visible only if is success result after users search by class name */}
                                    {clMembers ? <Checkbox
                                        size='small'
                                        color="default"
                                        disabled={open}
                                        checked={selectedUsers.indexOf(s.name) > -1}
                                        onClick={() => this.handleSelectedList(s.name)} />
                                        : null}
                                </ListItem>))}
                        </List> : null}

                    {/* Message if result is null */}
                    {(isResult && users.length === 0) ? <Alert severity={alert}>{msg}</Alert> : null}
                </div>
            </div>
        )
    }
}

export default withRouter(Search);