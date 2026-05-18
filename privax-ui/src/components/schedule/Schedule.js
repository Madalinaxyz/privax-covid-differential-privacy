import React, { useState, useEffect } from 'react'
import { Statistic, Icon, Grid, Container, Image, Segment, Dimmer, Loader } from 'semantic-ui-react'
import { privaxApi } from '../misc/PrivaxApi'
import { handleLogError } from '../misc/Helpers'

function Schedule() {
    return (
        <Container text>
        <Grid stackable columns={2}>
            <Grid.Row>
            <Grid.Column textAlign='center'>
                <Segment color='blue'>
                <Statistic>
                    <Statistic.Label>Users</Statistic.Label>
                </Statistic>
                </Segment>
            </Grid.Column>
            <Grid.Column textAlign='center'>
                <Segment color='blue'>
                <Statistic>
                    <Statistic.Label>Reports</Statistic.Label>
                </Statistic>
                </Segment>
            </Grid.Column>
            </Grid.Row>
        </Grid>

        <Image src='https://react.semantic-ui.com/images/wireframe/media-paragraph.png' style={{ marginTop: '2em' }} />
        <Image src='https://react.semantic-ui.com/images/wireframe/paragraph.png' style={{ marginTop: '2em' }} />
        </Container>
    )
}

export default Schedule