# this repo is now archived

# count-bugs

Show bugs from multiple repositories


## Development

If you want to inspect the code, or want to make changes, then you setup your system


### Install Node

You can find it at <https://nodejs.org/en/download/>.  If it is already installed you can upgrade it

```
npm install npm@latest -g

```
Verify node is installed, and see the version:

```
npm -v
```

### Install Yarn

Ensure Yarn is installed globally:

```
npm install -g yarn

```
Verify the install worked, and see the version installed: 

```
yarn -v
```

### Install this code

Fork this repository to your GitHub account, then clone and install:

```
git clone https://github.com/<YOUR_ACCOUNT>/count-bugs.git
cd count-bugs
yarn install
```

### Start Node Web Server

Start a local development server on [port 5000](http://localhost:5000). 

```
yarn start
```

### Debugging

Any ESLint errors will pollute the console output during development. Many can be fixed with 

```
yarn lint --fix
```

You can run the tests with

```
yarn test 
``` 

Some tests use html templates for comparision.  If you change the page structure, then you must update the template:
 
```
yarn test -u
```

If you want feedback on your pull request, but tests do not pass yet, you can push with `--no-verify`:

```
git push --no-verify origin
``` 


### Troubleshooting

- `yarn reset` to clear the local cache



