import {View} from "react-native";

const TasksScreen = () => {
	return (
		<View style={{alignItems: 'center',flex: 1,justifyContent: 'center'}}>
			<View style={{alignItems: 'center',backgroundColor: 'lightblue',height: 200,justifyContent: 'center',width: 200}}>
				<View style={{backgroundColor: 'blue',height: 100,width: 100}} />
			</View>
			<View style={{alignItems: 'center',backgroundColor: 'lightgreen',height: 200,justifyContent: 'center',width: 200}}>
				<View style={{backgroundColor: 'green',height: 100,width: 100}} />
			</View>
		</View>
	)
}

export default TasksScreen;