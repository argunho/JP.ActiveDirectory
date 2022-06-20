import React from 'react'

export default function Loading({ img, msg }) {
  return (
    <div className='block-centered'>
      <img src={img} className='loading' alt="loading" />
      <p>{msg}</p>
    </div>
  )
}
