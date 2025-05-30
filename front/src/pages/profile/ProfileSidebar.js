
import { Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import LinkContainer from 'react-router-bootstrap/LinkContainer';

function ProfileSidebar(props) {
  return (
    <>
      <Row className="bg-body-tertiary d-grid gap-2 mb-4">
        <LinkContainer to={`/profile`}>
          <Button className='style-button-outline'>Информация</Button>
        </LinkContainer>
        <LinkContainer to={`/profile/integrations`}>
          <Button className='style-button-outline'>Интеграции</Button>
        </LinkContainer>
      </Row>
    </>
  );
}

export default ProfileSidebar;