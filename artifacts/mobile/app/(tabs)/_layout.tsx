/**
 * Tab Layout — 4 abas: Início, Ferramentas, Descobrir, Eu.
 * Usa NativeTabs no iOS 26+ com liquid glass, ClassicTabs no Android/web.
 */
import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="tools">
        <Icon sf={{ default: 'wrench', selected: 'wrench.fill' }} />
        <Label>Ferramentas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <Icon sf={{ default: 'safari' as any, selected: 'safari.fill' as any }} />
        <Label>Descobrir</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Eu</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
          marginBottom: isWeb ? 0 : 2,
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: isWeb ? 84 : 62,
          // No web, a altura já inclui a área inferior de 34px.
          // Adicionar paddingBottom aqui fazia os rótulos serem cortados.
          paddingBottom: isWeb ? 0 : 8,
          paddingTop: isWeb ? 10 : 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]}
            />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? 'house.fill' : 'house'}
                tintColor={color}
                size={24}
              />
            ) : (
              <MaterialCommunityIcons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Ferramentas',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? 'wrench.fill' : 'wrench'}
                tintColor={color}
                size={24}
              />
            ) : (
              <MaterialCommunityIcons
                name={focused ? 'tools' : 'tools'}
                size={24}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Descobrir',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={(focused ? 'safari.fill' : 'safari') as any}
                tintColor={color}
                size={24}
              />
            ) : (
              <MaterialCommunityIcons
                name={focused ? 'compass' : 'compass-outline'}
                size={24}
                color={color}
              />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Eu',
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView
                name={focused ? 'person.fill' : 'person'}
                tintColor={color}
                size={24}
              />
            ) : (
              <MaterialCommunityIcons
                name={focused ? 'account' : 'account-outline'}
                size={24}
                color={color}
              />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
