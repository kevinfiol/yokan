import { suite, run } from 'flitch';
import { strict as assert } from 'node:assert';
import { Model, string, number, boolean, object, array } from './index.js'

const test = suite('modus tests');

const shouldThrow = fn => {
  let thrown = false;
  try { fn() }
  catch { thrown = true; }
  assert.ok(thrown);
};

test('test basic usage', () => {
  const User = Model({
    name: string(),
    age: number(),
    registered: boolean(),
    pets: array(),
    profile: object()
  });

  // should throw on initialization
  shouldThrow(() => {
    User({
      name: 10,
      age: 'not a num',
      registered: true,
      pets: [],
      profile: {}
    });
  })

  const user = User({
    name: 'kevin',
    age: 20,
    registered: true,
    pets: ['maggie'],
    profile: {}
  });

  // modifying with the wrong type should throw
  shouldThrow(() => user.name = 20);

  // object should remain unmodified
  assert.equal(user.name, 'kevin');

  shouldThrow(() => user.age = 'not a num');
  shouldThrow(() => user.registered = 'not a bool');
  shouldThrow(() => user.pets = {});
  shouldThrow(() => user.profile = []);
});

test('nested models', () => {
  const User = Model({
    name: string({ required: false }),
    profile: Model({
      password: string({ required: true }),
      posts: number({ required: false })
    })
  });

  const user = User({
    name: 'kevin',
    profile: {
      password: 'this is required',
      posts: 10
    }
  });

  assert.deepEqual(user, {
    name: 'kevin',
    profile: { password: 'this is required', posts: 10 }
  });

  shouldThrow(() => {
    user.profile.password = 10;
  });

  // should not throw when setting appropriate type
  user.profile.password = 'hunter2';
  assert.equal(user.profile.password, 'hunter2');

  // should throw on initialization
  shouldThrow(() => {
    User({
      name: 'kevin',
      profile: {
        password: 10,
        posts: 'asdfasdf'
      }
    })
  });

  // should not throw when not setting non-required fields
  let tmp = User({
    profile: {
      password: 'passwd'
    }
  });

  // should still typecheck optional fields
  tmp.name = 10;
  console.log(tmp);
});

run();

// const Profile = Model({
//   password: string({
//     required: true,
//     validate: x => x.length > 5
//   }),
//   posts: number({ default: 234 })
// });

// const User = Model({
//   name: string({ required: true }),
//   age: number(x => x > 3),
//   profile: Profile
//   // profile: object({ default: {}, schema: Profile.schema })
// });

// const user = User({
//   name: 'kevin',
//   age: 18,
//   profile: { password: 'fassdff', posts: 10 }
// });

// user.profile.password = 'asdfaf';
// user.profile.posts = 3435
// user.profile = 10;

// const profile = Profile({
//   password: 'niceaa'
// });

// console.log(profile);



// const user = User({
//   name: 'kevin',
//   age: 15,
//   profile: {
//     password: 'wahooo'
//   }
// });
