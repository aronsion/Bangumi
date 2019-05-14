/*
 * @Author: czy0729
 * @Date: 2019-05-08 17:13:08
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-05-11 03:16:40
 */
import React from 'react'
import { StyleSheet, ScrollView, View } from 'react-native'
import { observer } from 'mobx-react'
import { Flex, Text, Image } from '@components'
import { appNavigate } from '@utils/app'
import _, { wind, md, colorPlain, colorBorder } from '@styles'
import Stars from '../stars'

const avatarWidth = 28
const regSubject = /\/\/bgm.tv\/subject\/\d+$/

class TimelineItem extends React.Component {
  static defaultProps = {
    navigation: null,
    avatar: {},
    p1: {},
    p2: {},
    p3: {
      text: [],
      url: []
    },
    p4: {},
    reply: {},
    image: []
  }

  appNavigate = url => {
    const { navigation } = this.props
    appNavigate(url, navigation)
  }

  renderP3() {
    const { p3 } = this.props

    // 位置3: 多个条目信息
    let $p3
    if (p3.text.length > 1) {
      $p3 = []
      p3.text.forEach((item, index) => {
        const url = String(p3.url[index])
        const isSubject = !!url.match(regSubject)
        $p3.push(
          <Text
            key={item}
            type={isSubject ? undefined : 'main'}
            underline={isSubject}
            size={12}
            onPress={() => this.appNavigate(url)}
          >
            {item}
          </Text>,
          <Text key={`${item}.`} size={12}>
            、
          </Text>
        )
      })
      $p3.pop()
    } else if (p3.text.length === 1) {
      const isSubject = !!String(p3.url[0]).match(regSubject)
      $p3 = (
        <Text
          type={isSubject ? undefined : 'main'}
          underline={isSubject}
          size={12}
          onPress={() => this.appNavigate(p3.url[0])}
        >
          {p3.text[0]}
        </Text>
      )
    }

    return $p3
  }

  renderP() {
    const { p1, p2, p3, p4 } = this.props

    // 是否渲染第一行
    const hasPosition = !!(p1.text || p2.text || p3.text.length || p4.text)
    if (!hasPosition) {
      return null
    }

    return (
      <Text>
        {!!p1.text && (
          <Text type='main' size={12} onPress={() => this.appNavigate(p1.url)}>
            {p1.text}{' '}
          </Text>
        )}
        <Text size={12}>{p2.text} </Text>
        {this.renderP3()}
        {!!p4.text && <Text size={12}> {p4.text}</Text>}
      </Text>
    )
  }

  renderDesc() {
    const { navigation, subject, subjectId, comment, reply } = this.props
    return (
      <>
        {!!subject && (
          <Text
            style={_.mt.sm}
            underline
            onPress={() => {
              navigation.push('Subject', {
                subjectId
              })
            }}
          >
            {subject}
          </Text>
        )}
        {!!(comment || reply.content) && (
          <Text style={_.mt.sm} lineHeight={20}>
            {comment || reply.content}
          </Text>
        )}
      </>
    )
  }

  renderImages() {
    const { p3, image } = this.props
    if (image.length <= 1) {
      return null
    }

    const images = image.map((item, index) => (
      <Image
        key={item}
        style={_.mr.sm}
        src={item}
        size={48}
        radius
        border={colorBorder}
        onPress={() => this.appNavigate(p3.url[index])}
      />
    ))
    if (image.length <= 5) {
      return (
        <Flex style={_.mt.sm} wrap='wrap'>
          {images}
        </Flex>
      )
    }

    // 有一次性操作很多条目很多图片的情况, 水平滚动比较合适
    return (
      <ScrollView style={_.mt.sm} horizontal>
        {images}
      </ScrollView>
    )
  }

  render() {
    const { style, index, avatar, p3, star, reply, time, image } = this.props
    return (
      <Flex style={[styles.item, style]} align='start'>
        <View style={styles.image}>
          {!!avatar.src && (
            <Image
              src={avatar.src}
              size={avatarWidth}
              radius
              border={colorBorder}
              onPress={() => this.appNavigate(avatar.url)}
            />
          )}
        </View>
        <Flex.Item
          style={[styles.content, index !== 0 && styles.border, _.ml.sm]}
        >
          <Flex align='start'>
            <Flex.Item>
              {this.renderP()}
              {this.renderDesc()}
              {this.renderImages()}
              <Flex style={_.mt.md} align='baseline'>
                {!!reply.count && (
                  <Text type='primary' size={12}>
                    {reply.count}
                  </Text>
                )}
                <Text style={_.mr.sm} type='sub' size={12}>
                  {time}
                </Text>
                <Stars value={star} />
              </Flex>
            </Flex.Item>
            {image.length === 1 && (
              <Image
                style={_.ml.sm}
                src={image[0]}
                size={48}
                radius
                border={colorBorder}
                onPress={() => this.appNavigate(p3.url[0])}
              />
            )}
          </Flex>
        </Flex.Item>
      </Flex>
    )
  }
}

export default observer(TimelineItem)

const styles = StyleSheet.create({
  item: {
    backgroundColor: colorPlain
  },
  image: {
    width: avatarWidth,
    marginTop: md,
    marginLeft: wind
  },
  content: {
    paddingVertical: md,
    paddingRight: wind
  },
  border: {
    borderTopColor: colorBorder,
    borderTopWidth: StyleSheet.hairlineWidth
  }
})