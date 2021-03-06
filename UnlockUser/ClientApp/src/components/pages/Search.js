import React, { Component } from 'react'
import { withRouter } from 'react-router-dom'
import axios from 'axios'
import { capitalize } from '@mui/material'
import { SearchOffSharp, SearchSharp } from '@mui/icons-material'
import {
    Button, Checkbox, FormControl, FormControlLabel, Tooltip,
    Radio, RadioGroup, TextField, Switch, Autocomplete
} from '@mui/material'
import Result from '../blocks/Result'
import ModalHelpTexts from './../blocks/ModalHelpTexts'
import schools from './../../json/schools.json'; // List of all schools in Alvesta municipalities

export class Search extends Component {
    static displayName = Search.name;

    constructor(props) {
        super(props);

        const sOption = sessionStorage.getItem("sOption");
        const clsSearch = (sOption === "members");
        this.state = {
            input: "",
            additionInput: "",
            users: JSON.parse(sessionStorage.getItem("users")) || [],
            inProgress: false,
            isResult: false,
            sOption: sOption || "user",
            choiceList: [
                { label: "Match", match: true },
                { label: "Exakt", match: false }
            ],
            clsStudents: clsSearch,
            match: true,
            isCapitalize: clsSearch,
            isOpen: false,
            isNoOptions: false,
            response: null,
            showTips: localStorage.getItem("showTips") === "true",
        }

        this.checkboxHandle = this.checkboxHandle.bind(this);

        this.source = axios.CancelToken.source();

        // Search options
        this.sOptions = [
            { label: "Änvändare", value: "user" },
            { label: "Klass elever", value: "members" }
        ]

        // Help texts
        this.helpTexts = [
            { label: "Änvändare", tip: "Det här alternativet är till för att söka efter en specifik användare. Välj rätt sökalternativ nedan för att få den förväntande resultat.", value: "user", },
            { label: "Klass elever", tip: "Det här alternativet är till för att söka efter alla elever i en specifik klass med klass- och skolnamn.", value: "members" },
            { label: "Versal", tip: "Matchning med Namn/Efternamn/Användarnamn vilka börjar med samma Versal.", value: "isCapitalize" },
            { label: "Match", tip: "Matchningen av det angivna sökord bland alla elevers Namn/Efternamn/Användarnamn vilka innehåller angiven sökord.", value: "match" },
            { label: "Exakt", tip: "Matchning med exakt stavat Namn/Efternamn/Användarnamn.", value: "exact" },
            { label: "Tips", tip: "Genom att klicka på detta alternativ under varje sökalternativ aktiveras en dold tipsruta som visas när du för musen över sökalternativen.", value: "tips" },
            { label: "Resultat", tip: "Resultatet kan bli från 0 till flera hittade användare beroende på sökord och sökalternative.", value: "", color: "#c00" }
        ]

        this.group = sessionStorage.getItem("group");

        if (this.group !== "Students") {
            this.sOptions.splice(1, 1);
            this.helpTexts.splice(1, 1);
        }
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");

        if (token === null || token === undefined) // Return to the start page if a user is unauthorized
            this.props.history.push("/");
        else if (this.props.history.action === "POP") // Clean the old result if the page is refreshed
            sessionStorage.removeItem("users");
    }

    componentWillUnmount() {
        localStorage.setItem("showTips", this.state.showTips)
    }

    // Handle a change of text fields and radio input value
    valueChangeHandler = (e, open) => {
        if (!e.target) return;
        const inp = e.target;
        const inpRadio = (inp.type === "radio");
        this.setState({
            [inp.name]: inpRadio ? inp.value === "true"
                : (this.state.isCapitalize ? capitalize(inp.value) : inp.value),
            isResult: false,
            users: [],
            response: null,
            isNoOptions: (open) ? schools.filter(x => x.value.includes(inp.value)).length === 0 : false,
            isCapitalize: (inpRadio && inp.value !== "true") ? false : this.state.isCapitalize
        })
        // Capitalize i js
        // str.charAt(0).toUpperCase() + str.slice(1)
    }

    // Handle a change of checkbox input value
    checkboxHandle = (capitalized) => {
        const { input } = this.state

        this.setState({
            input: capitalized ? capitalize(input) : input.toLowerCase(),
            isCapitalize: capitalized,
            isResult: false,
            users: [],
            response: null
        })
    }

    // Return one from help texts found by the keyword
    returnToolTipByKeyword(keyword) {
        if (!this.state.showTips) return "";
        return this.helpTexts.find(x => x.label === keyword)?.tip;
    }

    // Handle changes in search alternatives and parameters
    setSearchParameter = value => {
        this.setState({
            sOption: value,
            input: "",
            additionInput: "",
            users: [],
            isResult: false,
            match: this.state.clsStudents,
            clsStudents: !this.state.clsStudents,
            isCapitalize: !this.state.clsStudents
        })

        //  Save choice of search parameters in sessionStorage to mind the user choice and use it with page refresh
        sessionStorage.setItem("sOption", value)
    }

    // Switch show of tips
    switchShowTips = (showTips) => {
        localStorage.setItem("showTips", !showTips)
        this.setState({ showTips: !showTips })
    }

    // Reset form
    resetResult = () => {
        this.setState({ users: [], isResult: false, response: null });

        // Remove result from sessionStorage
        sessionStorage.removeItem("users");
        sessionStorage.removeItem("selectedUsers");
    }

    // Recognize Enter press to submit search form
    handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            this.setState({ [e.target.name]: e.target.value });
            this.getSearchResult.bind(this);
        }
    }

    // Function - submit form
    async getSearchResult(e) {
        e.preventDefault();

        // To authorize
        const _config = {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem("token")}` },
            cancelToken: this.source.token
        };

        sessionStorage.removeItem("selectedUsers");
        sessionStorage.removeItem("users");

        // Update state parameters
        this.setState({ inProgress: true, users: [], isResult: false });

        // State parameters
        const { input, match, isCapitalize, sOption, additionInput, clsStudents } = this.state;

        // Return if form is invalid
        if (input.length < 1) {
            this.setState({ inProgress: false });
            return;
        }

        // API parameters by chosen searching alternative
        const params = (!clsStudents) ? match + "/" + isCapitalize : additionInput;

        // API request
        await axios.get("search/" + sOption + "/" + input + "/" + params, _config).then(res => {
            // Response
            const { users, errorMessage } = res.data;

            // Update state parameters
            setTimeout(() => {
                this.setState({
                    users: users || [],
                    inProgress: false,
                    isResult: true,
                    input: users?.length > 0 ? "" : input,
                    additionInput: users?.length > 0 ? "" : additionInput,
                    response: res.data
                })
            }, 100);

            // If something is wrong, view error message in browser console
            if (errorMessage) console.error("Error => " + errorMessage)
        }, error => {
            // Error handle 
            this.setState({ inProgress: false })

            if (error?.response?.status === 401) {
                this.setState({
                    response: {
                        msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
                        alert: "error"
                    },
                    isResult: true
                })
                setTimeout(() => {
                    this.props.history.push("/");
                }, 3000)
            } else if (error.code === "ERR_CANCELED") {
                this.source = axios.CancelToken.source();
                this.setState({
                    response: {
                        msg: error.message,
                        alert: "warning"
                    },
                    isResult: true
                })
                setTimeout(() => { this.resetResult(); }, 3000)
            } else
                console.error("Error => " + error.response)
        });
    }



    render() {
        // State parameters
        const { users, inProgress,
            isResult, choiceList, match, response,
            isCapitalize, sOption, showTips,
            clsStudents, isOpen, isNoOptions } = this.state;

        // List of text fields
        const sFormParams = !clsStudents ? [{ name: "input", label: "Namn", placeholder: (!match) ? "Skriv exakt fullständigt namn eller anvädarnamn här ..." : "", autoOpen: false }]
            : [{ name: "input", label: "Klassbeteckning", clsName: "search-first-input", placeholder: "Skriv exakt klassbeteckning här ...", autoOpen: false },
            { name: "additionInput", label: "Skolnamn", clsName: "search-second-input", placeholder: "Skriv exakt skolnamn här ..", autoOpen: true }];

        const isActive = (this.state.input || this.state.additionInput).length > 0;


        return (
            <div className='interior-div' onSubmit={this.getSearchResult.bind(this)}>
                {/* Search form */}
                <form className='search-wrapper'>
                    {/* List loop of text fields */}
                    {sFormParams.map((s, index) => (
                        <Autocomplete
                            key={index}
                            freeSolo
                            disableClearable
                            className={s.clsName || 'search-input'}
                            options={schools}
                            getOptionLabel={(option) => option.label || ""}
                            autoHighlight
                            open={s.autoOpen && isOpen && !isNoOptions}
                            inputValue={this.state[s.name]}
                            onChange={(e, option) => (e.key === "Enter") ? this.handleKeyDown : this.setState({ [s.name]: option.value })}
                            onBlur={() => this.setState({ isOpen: false })}
                            onClose={() => this.setState({ isOpen: false })}
                            onFocus={() => this.setState({ isOpen: (s.autoOpen && !isNoOptions) })}
                            renderInput={(params) =>
                                <TextField
                                    {...params}
                                    name={s.name}
                                    label={s.label}
                                    error={response?.warning || false}
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        maxLength: 30,
                                        minLength: 2
                                    }}
                                    value={this.state[s.name]}
                                    disabled={inProgress}
                                    placeholder={s.placeholder}
                                    onKeyDown={this.handleKeyDown}
                                    onChange={(e) => this.valueChangeHandler(e, s.autoOpen)}
                                    helperText={this.state[s.name].length > 0
                                        ? `${30 - this.state[s.name].length} tecken kvar` : "Min 2 & Max 30 tecken"}
                                />}
                        />
                    ))}

                    {/* Submit form - button */}
                    <Button
                        variant={isActive ? "contained" : "outlined"}
                        color={isActive ? "primary" : "inherit"}
                        className="search-button search-button-mobile"
                        type="submit"
                        disabled={!isActive || inProgress}>
                        <SearchSharp /></Button>

                    {/* Reset form - button */}
                    {isActive ? <Button
                        variant="text"
                        color="error"
                        className="search-reset search-button-mobile"
                        disabled={inProgress}
                        onClick={() => this.setState({ input: "", additionInput: "", isOpen: false })}>
                        <SearchOffSharp />
                    </Button> : null}
                </form >

                {/* The search parameters to choice */}
                <div className="checkbox-radio-wrapper" >

                    {/* Modal  window with help texts */}
                    <ModalHelpTexts arr={this.helpTexts} cls="" isTitle="Förklaring av sökparametrar" />

                    {/* Switchable box */}
                    <FormControlLabel className='switch-btn'
                        control={<Switch checked={showTips} color='info'
                            onChange={this.switchShowTips.bind(this, showTips)}
                        />}
                        label="Tips" />

                    {/* Radio buttons to choice one of search alternatives */}
                    <FormControl className='checkbox-block-mobile' style={{ display: "inline-block" }}>
                        <RadioGroup row name="row-radio-buttons-group">
                            {/* Loop of radio input choices */}
                            {this.sOptions.map((p, index) => (
                                <Tooltip key={index} arrow disableHoverListener={!showTips} title={this.returnToolTipByKeyword(p.label)}
                                    classes={{ tooltip: "tooltip tooltip-green", arrow: "arrow-green" }}>
                                    <FormControlLabel
                                        value={sOption === p.value}
                                        control={<Radio
                                            size='small'
                                            checked={sOption === p.value}
                                            color="success" />}
                                        label={p.label}
                                        name="sOption"
                                        onChange={this.setSearchParameter.bind(this, p.value)} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl>

                    {/* Checkbox and radio with search parameters to choose for user search */}
                    <FormControl style={{ display: "block" }}>
                        <RadioGroup row
                            name="row-radio-buttons-group" >

                            {/* Checkbox */}
                            <Tooltip arrow disableHoverListener={!showTips} classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}
                                title={this.returnToolTipByKeyword("Versal")} >
                                <FormControlLabel
                                    control={<Checkbox size='small'
                                        checked={isCapitalize}
                                        name="isCapitalize"
                                        disabled={!match || clsStudents}
                                        onClick={() => this.checkboxHandle(!isCapitalize)} />}
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
                                            disabled={clsStudents} />}
                                        label={c.label}
                                        name="match"
                                        onChange={this.valueChangeHandler} />
                                </Tooltip>
                            ))}
                        </RadioGroup>
                    </FormControl >
                </div >

                {/* Result list */}
                <Result
                    users={users}
                    clsStudents={clsStudents}
                    isResult={isResult}
                    isVisibleTips={showTips}
                    inProgress={inProgress}
                    response={response}
                    group={this.group?.toLowerCase()}
                    cancelRequest={() => this.source.cancel("Pågående sökning har avbrutits ...")}
                    resetResult={this.resetResult.bind(this)}
                />

            </div >
        )
    }
}

export default withRouter(Search);

