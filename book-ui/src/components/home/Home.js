import React from 'react'
import { Container } from 'semantic-ui-react'
import '../../index.css'
import './Home.css'
import {Grid} from 'semantic-ui-react'
import {Segment} from 'semantic-ui-react'
import {useState} from 'react'


function Home() {
  const faqs = [
    { question: 'How do I change my details?', answer: 'You can update your details in the account settings section.' },
    { question: 'What platforms will I be able to use?', answer: 'Our system supports web, iOS, and Android applications.' },
    { question: 'Is my data secure?', answer: 'Yes, we use end-to-end encryption and follow industry best practices.' },
    { question: 'How can I schedule an appointment?', answer: 'You can schedule an appointment through your dashboard or mobile app.' },
    { question: 'Can I cancel my appointment?', answer: 'Yes, cancellations are allowed up to 24 hours before your scheduled time.' },
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };
  return (
    <>
      <Container text className="homepage-design"> 
        <div className="text-homepage">
          <h1>Welcome to the Vaccine Scheduling and Reporting System!</h1>
          <p>
            We make vaccination management simple and efficient. Schedule your appointments, track immunization records, and stay informed—all in one place. 
            Our goal is to streamline the vaccination process for individuals, healthcare providers, and organizations.
          </p>
        </div>
      </Container>

       <Container text className="vaccine-steps-container">
      {/* Section Title */}
      <h2 className="steps-heading">Getting Started with Vaccination</h2>
      
      {/* Step 1 */}
      <Grid stackable columns={2} className="steps-grid">
        <Grid.Row className="step-row">
          <Grid.Column width={8} textAlign='right'>
            <Segment className="step-box">
              <span className="step-number">01</span>
              <h3 className="step-title">Register</h3>
              <p className="step-description">Sign up and provide your personal details to create an account.</p>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      
      {/* Step 2 */}
        <Grid.Row className="step-row">
          <Grid.Column width={8} textAlign='left'>
            <Segment className="step-box">
              <span className="step-number">02</span>
              <h3 className="step-title">Schedule Appointment</h3>
              <p className="step-description">Choose a vaccination center and book your preferred time slot.</p>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      
      {/* Step 3 */}
        <Grid.Row className="step-row">
          <Grid.Column width={8} textAlign='right'>
            <Segment className="step-box">
              <span className="step-number">03</span>
              <h3 className="step-title">Receive Vaccination</h3>
              <p className="step-description">Visit the selected center and get vaccinated as per your schedule.</p>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      
      {/* Step 4 */}
        <Grid.Row className="step-row">
          <Grid.Column width={8} textAlign='left'>
            <Segment className="step-box">
              <span className="step-number">04</span>
              <h3 className="step-title">Report & Track</h3>
              <p className="step-description">Update your vaccination status and track your immunization records.</p>
            </Segment>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Container>
     {/* FAQ Section */}
      <Container className="faq-container">
        <h2 className="faq-heading">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className={`faq-item ${openIndex === index ? 'open' : ''}`} onClick={() => toggleFAQ(index)}>
              <div className="faq-question">
                {faq.question}
                <span className="faq-toggle">{openIndex === index ? '✖' : '+'}</span>
              </div>
              {openIndex === index && <div className="faq-answer">{faq.answer}</div>}
            </div>
          ))}
        </div>
      </Container>
    </>
  )
}

export default Home
