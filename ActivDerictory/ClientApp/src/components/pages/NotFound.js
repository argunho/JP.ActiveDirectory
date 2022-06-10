import React from 'react'
import wrongWay from './../../images/wrongWay.jpg'
import './../../css/notfound.css'
import { useHistory } from 'react-router-dom'

export default function NotFound(props) {
    const history = useHistory()

    return (
        <div className='notfound-container'>
            <div className='notfound-wrapper'>
                <img className='notfound-img' src={wrongWay} alt={props.location.pathname} />
                <p className='wrong-url'>{window.location.href}</p>
                <p className='right-url' onClick={() => history.push("/")}>Klicka här ...</p>
            </div>
        </div>
    )
}
