/**
 * TR: Kullanıcı formu field tanımları.
 * EN: User form field definitions.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { 
  StringField, 
  IntegerField, 
  EnumField, 
  DateField, 
  BooleanField, 
  TextAreaField 
} from 'ng-signalify/fields';

export const userFields = [
  new StringField('firstName', 'First Name', {
    required: true,
    min: 2,
    max: 50,
    hint: 'Enter your first name'
  }),
  
  new StringField('lastName', 'Last Name', {
    required: true,
    min: 2,
    max: 50
  }),
  
  new StringField('email', 'Email Address', {
    required: true,
    email: true,
    hint: "We'll never share your email"
  }),
  
  new IntegerField('age', 'Age', {
    required: true,
    min: 18,
    max: 120
  }),
  
  new EnumField('role', 'Role', [
    { id: 'admin', label: 'Administrator' },
    { id: 'user', label: 'User' },
    { id: 'guest', label: 'Guest' }
  ], { required: true }),
  
  new EnumField('status', 'Status', [
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
    { id: 'pending', label: 'Pending' }
  ], { required: true }),
  
  new DateField('birthDate', 'Birth Date', {
    maxDate: new Date(),
    hint: 'Your date of birth'
  }),
  
  new BooleanField('emailVerified', 'Email Verified'),
  
  new TextAreaField('bio', 'Biography', {
    maxLength: 500,
    hint: 'Tell us about yourself (max 500 characters)'
  })
];
