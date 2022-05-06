import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { Alert, Button } from '@mui/material';
import Loading from './Loading';
import loading from './../images/loading.gif'

export class Home extends Component {
  static displayName = Home.name;

  constructor(props) {
    super(props);

    this.state = {
      load: true,
      access: false,
      alert: "",
      msg: "Kontroll av åtkomstbehörigheter" //"Control of access rights"
    }

    sessionStorage.clear();
  }

  componentDidMount() {
    const token = sessionStorage.getItem("token");
    const login = sessionStorage.getItem("login");
    if (token !== null && token !== undefined)
      this.props.history.push("/find-user");
    else if (login !== null && login !== undefined)
      this.props.history.push("/login");
    else {
      axios.get("auth").then(res => {

        this.setState({ load: false, response: res.data });

        if (res.data?.access) {
          sessionStorage.setItem("token", res.data?.token);
          setTimeout(() => {
            this.props.history.push("/find-user");
          }, 2000)
        }
      }, error => {
        console.error("Error => " + error);
      })
    }
  }

  responseBlock(response) {
    return (
      <div className='block-centered'>
        <Alert severity={response?.alert} className="acces-response">{response.msg}</Alert>
        {(!response?.access)
          ? <Button className='login-link'
            color="inherit"
            onClick={() => this.props.history.push("/Login")}>
            Logga in med ett annat konto
          </Button> : null}
      </div>
    )
  }

  render() {
    const { load, msg, response } = this.state;

    return (
      load ? <Loading msg={msg} img={loading} />
        : this.responseBlock(response)
    );
  }
}

export default withRouter(Home);