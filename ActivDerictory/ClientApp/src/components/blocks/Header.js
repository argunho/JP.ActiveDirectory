import React, { useEffect, useState } from 'react'
import { Link, useHistory } from 'react-router-dom';
import jwt_decode from "jwt-decode";
import { HomeSharp, Logout } from '@mui/icons-material';
import { Button } from '@mui/material';
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
                <a className="logo" href="https://alvesta.se">
                    <img alt="Alvesta" src={logo} />
                </a>
            </div>
            <nav className="nav-wrapper">
                    <ul className='container'>
                        <li>
                            <Link className="link" to="/find-user">
                                <HomeSharp />Unlock User
                            </Link>
                        </li>
                        {isAuthorized ?
                            <li className='displayName'>
                                <p className='link'>{displayName}</p>
                                <Button variant='outlined' size="large" className='logout-btn' onClick={() => logout()}>
                                    <Logout />&nbsp;&nbsp;<span>Logga ut</span>
                                </Button>
                            </li>
                            : null}
                    </ul>
            </nav>
        </header>
    )
}
