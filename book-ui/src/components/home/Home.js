import React, { useState, useEffect } from 'react'
import { Statistic, Icon, Grid, Container, Image, Segment, Dimmer, Loader } from 'semantic-ui-react'
import { bookApi } from '../misc/BookApi'
import { handleLogError } from '../misc/Helpers'
import '../../index.css'
import './Home.css'
function Home() {


  return (
    <Container text className="homepage-design"> 

      {/* <Image src='https://react.semantic-ui.com/images/wireframe/media-paragraph.png' style={{ marginTop: '2em' }} />
      <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' style={{ marginTop: '2em' }} /> */}
      <div className="text-homepage">
        <h1>Welcome to our website</h1>
        <p>Yes, "Vaccine Scheduling and Reporting System" is correctly structured. However, if you're using it as a URL slug or a file name, you might want to format it like this:</p>
      </div>
    </Container>
  )
}

export default Home