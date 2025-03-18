import React, { useState } from 'react'
import { Container, Button, Label, TabPane, Tab  } from 'semantic-ui-react'
import { bookApi } from '../misc/BookApi'
import { handleLogError } from '../misc/Helpers'



import {
    CardMeta,
    CardHeader,
    CardDescription,
    CardContent,
    Card,
    Icon,
    Image,
  } from 'semantic-ui-react'

import "./reports.css"
import TableReport from './TableReport'
import FormReport from './FormReport'
import MapReport from './MapReport'


function Report() {
    const [test, setTest] = useState("Not Assigned")

    const fetchData = async () => {
        try {
            const responseUsers = await bookApi.test()
            console.log(responseUsers)
            setTest(responseUsers.data)
        } catch (error) {
            handleLogError(error)
        }
    }

    const panes = [
        { menuItem: 'View Reports', render: () => <TabPane><TableReport  handleLogError={handleLogError}/></TabPane> },
        { menuItem: 'View Map', render: () => <TabPane><MapReport/></TabPane> },
        { menuItem: 'Add Report', render: () => <TabPane><FormReport/></TabPane> },
      ]

    return (
        <div className='report-container'>
            <Tab menu={{ fluid: true, vertical: true, tabular: true }} panes={panes} />
        </div>
    )
}

export default Report
