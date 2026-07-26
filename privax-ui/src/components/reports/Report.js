import React from 'react'
import { TabPane, Tab } from 'semantic-ui-react'
import { handleLogError } from '../misc/Helpers'

import "./reports.css"
import TableReport from './TableReport'
import FormReport from './FormReport'
import MapReport from './MapReport'
import SymptomStats from './SymptomStats'

function Report() {
    const panes = [
        { menuItem: 'View Reports', render: () => <TabPane><TableReport  handleLogError={handleLogError}/></TabPane> },
        { menuItem: 'View Map', render: () => <TabPane><MapReport/></TabPane> },
        { menuItem: 'Symptom prevalence', render: () => <TabPane><SymptomStats/></TabPane> },
        { menuItem: 'Add Report', render: () => <TabPane><FormReport/></TabPane> },
      ]

    return (
        <div className='reports-page'>
            <div className='reports-header'>
                <div className='reports-header-left'>
                    <span className='reports-eyebrow'>Live data</span>
                    <h1 className='reports-title'>Reports</h1>
                </div>
                <p className='reports-sub'>
                    Explore anonymized vaccine experiences from across the network — or submit yours.
                </p>
            </div>
            <div className='reports-tabs-wrap'>
                <Tab menu={{ fluid: true, vertical: true, tabular: true }} panes={panes} />
            </div>
        </div>
    )
}

export default Report
