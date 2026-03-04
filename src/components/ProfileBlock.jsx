import '../styles/ProfileBlock.css'
import pirateAvatar from '../assets/Pirate.jpg';

const ProfileBlock = () => {
    return (
        <div className="profile">
            <div className='avatar'>
                <img src={pirateAvatar} alt="Аватар игрока" />
            </div>
            <div className='name'>
                Black Beard
            </div>
        </div>
    );
}

export default ProfileBlock;
