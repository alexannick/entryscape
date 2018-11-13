// NOTE! order of imports is important
import '@babel/polyfill';
import 'jquery';
import 'popper.js';
import 'bootstrap';
import 'bootstrap-material-design';
import 'typeahead.js/dist/typeahead.jquery';
import 'bloodhound-js'; // TODO @valentino typeahead alone seems to have issues, so import bloodhound seperately

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-material-design/dist/css/bootstrap-material-design.css';
import 'bootstrap-material-design/dist/css/ripples.css';
import 'bootstrap-material-datetimepicker/css/bootstrap-material-datetimepicker.css';
import 'font-awesome/css/font-awesome.min.css';
import 'chartist/dist/chartist.min.css'; // TODO ?
import '../assets/privacy_de.html';
import '../assets/privacy_en.html';
import '../assets/privacy_sv.html';
import registry from 'commons/registry';
import initDefaults from './defaults';

initDefaults(); // init defaults

export default registry;
