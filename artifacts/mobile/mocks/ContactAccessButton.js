'use strict';
const React = require('react');

class ContactAccessButton extends React.PureComponent {
  static isAvailable() {
    return false;
  }
  render() {
    return null;
  }
}

module.exports = ContactAccessButton;
module.exports.default = ContactAccessButton;
module.exports.ContactAccessButtonProps = {};
