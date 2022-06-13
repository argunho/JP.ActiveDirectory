import { Box } from '@mui/material'
import React from 'react'
import support from './../../images/support.png'

export default function Support() {
  return (
    <div className="contacts-wrapper">
        <Box component="img" src={support} />
    </div>
  )
}
