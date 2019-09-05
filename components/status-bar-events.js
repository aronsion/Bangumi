/*
 * tabbar前面几个页面不会二次渲染
 * 需要使用NavigationEvents的订阅来改变StatusBar的颜色
 * @Doc: https://reactnavigation.org/docs/en/navigation-events.html
 * @Author: czy0729
 * @Date: 2019-08-11 14:02:16
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-09-05 19:29:28
 */
import React from 'react'
import { StatusBar } from 'react-native'
import { NavigationEvents } from 'react-navigation'
import { IOS } from '@constants'

function StatusBarEvents({
  backgroundColor,
  barStyle,
  translucent,
  animated,
  ...other
}) {
  return (
    <>
      <NavigationEvents
        onDidFocus={() => {
          StatusBar.setBackgroundColor(backgroundColor, animated)
          StatusBar.setBarStyle(barStyle, animated)
          StatusBar.setTranslucent(translucent, animated)
        }}
      />
      <StatusBar
        backgroundColor={backgroundColor}
        barStyle={barStyle}
        translucent={translucent}
        animated={animated}
        {...other}
      />
    </>
  )
}

StatusBarEvents.defaultProps = {
  backgroundColor: '#ffffff',
  barStyle: 'dark-content',
  translucent: !IOS,
  animated: IOS
}

export default StatusBarEvents