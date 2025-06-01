
import { Col, Row } from 'react-bootstrap';


const Home = () => {
  return (<> <Row className='justify-content-center'>
    <Col xs={11} md={10} lg={8}>
      <h1>Главная страница</h1>
      <hr/>
      <div>
        Для корректной работы требуется войти в аккаунт и настроить интеграции для репозитория разработки, облачного хранилища и сервиса планировщика.
        <p></p>
      </div>
    </Col>
  </Row>
  </>);
};

export default Home;