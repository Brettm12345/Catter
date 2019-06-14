import {
  Container,
  createMuiTheme,
  CssBaseline,
  CircularProgress
} from '@material-ui/core';
import purple from '@material-ui/core/colors/purple';
import { ThemeProvider, makeStyles, createStyles } from '@material-ui/styles';
import React, { useCallback, useContext, useState, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  RouteProps
} from 'react-router-dom';
import './App.css';
import { Header } from './Header';
import './jost/jost.css';
import { Login } from './Login';
import { Register } from './Register';
import { Logout } from './Logout';
import { IUserContext, UserContext } from './State';
import { Feed } from './Feed';
import { SingleMeow } from './Meow';
import { User } from './User';

const theme = createMuiTheme({
  typography: {
    fontFamily: ['Jost', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(',')
  },
  palette: {
    type: 'dark',
    primary: purple,
    secondary: {
      main: '#f44336'
    }
  }
});

const PrivateRoute: React.FC<
  {
    component: any /*forgive me for i have sinned*/;
  } & RouteProps
> = ({ component: Component, ...rest }) => {
  const { token } = useContext(UserContext);
  const isAuthenticated = Boolean(token);
  return (
    <Route
      {...rest}
      render={props =>
        isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{ pathname: '/login', state: { from: props.location } }}
          />
        )
      }
    />
  );
};

const App: React.FC = () => {
  const setToken = useCallback(token => {
    setUserState(u => ({ ...u, token }));
  }, []);

  const [userState, setUserState] = useState<IUserContext>({
    token: localStorage.getItem('token'),
    setToken
  });

  return (
    <ThemeProvider theme={theme}>
      <UserContext.Provider value={userState}>
        <Router>
          <CssBaseline />
          <Header />
          <Suspense fallback={<Loader />}>
            <Container style={{ paddingTop: 16 }}>
              <Route path="/" exact component={Feed} />
              <Route path="/login" component={Login} />
              <Route path="/register" component={Register} />
              <Route path="/:username/:id" component={SingleMeow} />
              <Route path="/:username" exact component={User} />
              <PrivateRoute path="/logout" component={Logout} />
            </Container>
          </Suspense>
        </Router>
      </UserContext.Provider>
    </ThemeProvider>
  );
};

const useStyles = makeStyles(
  createStyles({
    container: {
      display: 'flex',
      width: '100%',
      justifyContent: 'center',
      padding: 16
    }
  })
);

const Loader = () => {
  const classes = useStyles({});
  return (
    <div className={classes.container}>
      <CircularProgress />
    </div>
  );
};

export default App;
