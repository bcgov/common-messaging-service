import React, {Component} from 'react';

class Footer extends Component {
  render() {
    return (
      <footer className="my-5 pt-5 text-muted text-center text-small">
        <p className="mb-1">Common Services Showcase Team</p>
        <ul className="list-inline">
          <li className="list-inline-item"><a id='footer-home' href="https://www.gov.bc.ca/">Home</a></li>
          <li className="list-inline-item"><a id="footer-about"
            href="https://www2.gov.bc.ca/gov/content/about-gov-bc-ca">About
            gov.bc.ca</a></li>
          <li className="list-inline-item"><a id="footer-disclaimer"
            href="http://gov.bc.ca/disclaimer">Disclaimer</a>
          </li>
          <li className="list-inline-item"><a id="footer-privacy" href="http://gov.bc.ca/privacy">Privacy</a>
          </li>
          <li className="list-inline-item"><a id="footer-accessibility"
            href="http://gov.bc.ca/webaccessibility">Accessibility</a></li>
          <li className="list-inline-item"><a id="footer-copyright"
            href="http://gov.bc.ca/copyright">Copyright</a>
          </li>
          <li className="list-inline-item"><a href="https://www2.gov.bc.ca/gov/content/home/contact-us">Contact
            Us</a>
          </li>
        </ul>
      </footer>
    );
  }
}

export default Footer;
