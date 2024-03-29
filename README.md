# yokan

Self-validating mutable objects.

```js
import { Model, string, array, number } from 'yokan';

// define your models
const Profile = Model({
  password: string(str => str.length > 5),
  pets: array({ type: 'string' })
});

// models can be nested
const User = Model({
  name: string(),
  age: number(),
  profile: Profile
});

// create an object
// this will throw if the initial object is invalid
const user = User({
  name: 'kevin',
  age: 20,
  profile: {
    password: 'hunter2',
    pets: ['maggie', 'trixie', 'flitch', 'haku']
  }
});

// modify your object as you normally would
user.name = 'rafael';

// the object will throw on invalid assignments
// throws "Error: .profile.password failed validation"
user.profile.password = '1234';
```

## Install

```shell
npm install yokan
```

## Credits

yokan is a minimalist take on [use-models-for-data](https://github.com/Pomax/use-models-for-data) by [Pomax](https://github.com/Pomax/).
