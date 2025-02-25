import React, { useState, useEffect } from 'react'
import { Statistic, Icon, Grid, Container, Image, Segment, Dimmer, Loader } from 'semantic-ui-react'
import { bookApi } from '../misc/BookApi'
import { handleLogError } from '../misc/Helpers'
import '../../index.css'

import './Home.css'

function Home() {
  return (
    <Container text className="homepage-design">
      <div className="text-box">
        <h1>Welcome to Our Website</h1>
        <p>This is a sample text box positioned on the left side of the screen.</p>
      </div>
    </Container>
  )
}

export default Home