import { Outlet, Link } from "react-router-dom";
import Nav from 'react-bootstrap/Nav';
import Cookies from 'universal-cookie';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Button from 'react-bootstrap/Button';
import LinkContainer from 'react-router-bootstrap/LinkContainer';
import Container from 'react-bootstrap/Container';

const cookies = new Cookies();
const Layout = () => {
    return (
        <>
            <Navbar expand="lg" className="bg-body-tertiary" >
                <Container>
                    <LinkContainer to="/">
                        <Navbar.Brand>SPMS</Navbar.Brand>
                    </LinkContainer>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="me-auto">
                            <LinkContainer to="/">
                                <Nav.Link>Главная</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to={{
                                pathname: "/projects",
                                search: "?filter=InProgress",
                                }} >
                                <Nav.Link>Проекты</Nav.Link>
                            </LinkContainer>
                            <LinkContainer to={{
                                pathname: "/applications",
                                }} >
                                <Nav.Link>Заявки на руководство</Nav.Link>
                            </LinkContainer>
                            <NavDropdown title="Встречи" id="basic-nav-dropdown">
                                <NavDropdown.Item>
                                    <LinkContainer to="/meetings">
                                        <div>Расписание</div>
                                    </LinkContainer>
                                </NavDropdown.Item>
                                <NavDropdown.Item>
                                    <LinkContainer to="/meetings/arrange">
                                        <div>Назначить</div>
                                    </LinkContainer>
                                </NavDropdown.Item>
                            </NavDropdown>
                        </Nav>
                        <Nav>
                            <div className="d-flex align-items-center">
                                <LinkContainer to="/scientificleadership/add">
                                    <Button className="style-button mx-2" variant="success" size="sm">Добавить проект</Button>
                                </LinkContainer>
                            </div>
                            {cookies.get('session_token') == undefined ?
                                <LinkContainer to="/login">
                                    <Nav.Link>Войти</Nav.Link>
                                </LinkContainer> :
                                <>
                                    <LinkContainer to={`/profile`}>
                                        <Nav.Link>Профиль</Nav.Link>
                                    </LinkContainer>
                                    <LinkContainer to={`/logout`}>
                                        <Nav.Link>Выйти</Nav.Link>
                                    </LinkContainer>
                                </>}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar >
            <Outlet />
        </>
    )
};

export default Layout;