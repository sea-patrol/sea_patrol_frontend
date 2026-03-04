import ShipModel from './ShipModel';

export default function OtherPlayerSailShip(props) {
  return (
    <group {...props} dispose={null}>
      <ShipModel />
    </group>
  )
}
