import {View} from "react-native";

const TasksScreen = () => {
	return (
		<View style={{flex: 1,justifyContent: 'center',alignItems: 'center'}}>
			<View style={{width: 200,height: 200,backgroundColor: 'lightblue',justifyContent: 'center',alignItems: 'center'}}>
				<View style={{width: 100,height: 100,backgroundColor: 'blue'}} />
			</View>
			<View style={{width: 200,height: 200,backgroundColor: 'lightgreen',justifyContent: 'center',alignItems: 'center'}}>
				<View style={{width: 100,height: 100,backgroundColor: 'green'}} />
			</View>
		</View>
	)
}

export default TasksScreen;