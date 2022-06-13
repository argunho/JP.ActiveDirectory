import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom';
import jwt_decode from "jwt-decode";
import { HomeSharp, LiveHelp, Logout } from '@mui/icons-material';
import { Button, Tooltip } from '@mui/material';
import logo from './../../images/logotype.png'

export default function Header({ isAuthorized }) {

    const history = useHistory();
    const [displayName, setDisplayName] = useState("");

    useEffect(() => {
        if (isAuthorized) {
            const token = sessionStorage.getItem("token");
            if (token !== null && token !== undefined) {
                const decodedToken = jwt_decode(token);
                setDisplayName(decodedToken?.DisplayName)
            }
        }
    }, [isAuthorized])

    const logout = () => {
        sessionStorage.clear();
        sessionStorage.setItem("login", "true");
        history.push("/login");
    }

    return (
        <header>
            <div className="logo-wrapper container">
                <a className="logo" href="https://alvesta.se" target="_blank" rel='noreferrer'>
                    <img alt="Alvesta Kommun" src={logo} />
                </a>
            </div>
            <nav className="nav-wrapper">
                <ul className='container'>
                    <li className="link-home">
                        <Link className="link" to="/find-user">
                            <HomeSharp /><span>Unlock User</span>
                        </Link>
                    </li>
                    {isAuthorized ?
                        <>
                            <li className=''>{displayName}</li>
                            <li>
                                {/* Button to logout */}
                                <Button variant='outlined' size="large" className='nav-btn' onClick={() => logout()}>
                                    <Logout />&nbsp;&nbsp;<span>Logga ut</span>
                                </Button>
                            </li>
                        </>
                        : null}
                    <li className='link'>
                        <Tooltip arrow title="Kontakta support"
                            classes={{ tooltip: "tooltip tooltip-margin" }}>
                            <Button variant='outlined' size="large" className='nav-btn' onClick={() => history.push("/contact")}>
                                <LiveHelp />
                            </Button>
                        </Tooltip>
                    </li>
                </ul>
            </nav>
        </header>
    )
}
