import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import LearnScreen from '../screens/LearnScreen';
import TopicScreen from '../screens/TopicScreen';
import LessonScreen from '../screens/LessonScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import ProgressScreen from '../screens/ProgressScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'FinanceIQ' }} />
      <Stack.Screen name="Topic" component={TopicScreen} options={({ route }) => ({ title: route.params.course.title })} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}

function LearnStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="AllCourses" component={LearnScreen} options={{ title: 'All Courses' }} />
      <Stack.Screen name="Topic" component={TopicScreen} options={({ route }) => ({ title: route.params.course.title })} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}

function CalcStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Calculators" component={CalculatorScreen} options={{ title: 'Calculators' }} />
    </Stack.Navigator>
  );
}

function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProgressMain" component={ProgressScreen} options={{ title: 'My Progress' }} />
      <Stack.Screen name="Topic" component={TopicScreen} options={({ route }) => ({ title: route.params.course.title })} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
    </Stack.Navigator>
  );
}

function TabIcon({ icon, label, focused }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            paddingTop: 6,
            paddingBottom: 8,
            height: 70,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}
      >
        <Tab.Screen
          name="HomeTab"
          component={HomeStack}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Learn"
          component={LearnStack}
          options={{
            tabBarLabel: 'Learn',
            tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Calc"
          component={CalcStack}
          options={{
            tabBarLabel: 'Calculator',
            tabBarIcon: ({ focused }) => <TabIcon icon="🧮" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Progress"
          component={ProgressStack}
          options={{
            tabBarLabel: 'Progress',
            tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
