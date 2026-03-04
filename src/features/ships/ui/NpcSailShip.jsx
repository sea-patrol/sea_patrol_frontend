import ShipModel from './ShipModel';

export default function NpcSailShip(props) {
  return (
    <group {...props} dispose={null}>
      <ShipModel />
    </group>
  )
}
