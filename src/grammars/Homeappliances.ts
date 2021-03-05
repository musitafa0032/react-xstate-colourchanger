export const grammar = `
<grammar root="Intelligent">
  <rule id="Intelligent">
  <one-of>
   <item><one-of>
    <item>Please</item>
    <item>please</item>
         </one-of>
    <ruleref uri="#homeappliances"/>
    <tag>out.homeappliances=Object(); out.homeappliances.object=rules.homeappliances.object;
       out.homeappliances.move=rules.homeappliances.type;</tag></item>
   <item><ruleref uri="#homeappliances"/>
          <tag>out.homeappliances=Object(); out.homeappliances.object=rules.homeappliances.object;
               out.homeappliances.move=rules.homeappliances.type;</tag></item>
   </one-of>
  </rule>
  <rule id="object1">
     <one-of>
        <item>light</item>
        <item>heat</item>
        <item>air conditioning</item>
        <item>AC<tag>out="air conditioning";</tag></item>
        <item>A C<tag>out="air conditioning";</tag></item>
     </one-of>
  </rule>
  <rule id="object2">
     <one-of>
        <item>window</item>
        <item>door</item>
     </one-of>
  </rule>
  <rule id="action1">
     <one-of>
        <item>off</item>
        <item>on</item>
     </one-of>
  </rule>
  <rule id="action2">
     <one-of>
        <item>close</item>
        <item>open</item>
     </one-of>
  </rule>
  <rule id="homeappliances">
     <one-of>
        <item>turn
            <ruleref uri="#action1"/>
             the
            <ruleref uri="#object1"/>
            <tag>out.object=rules.object1; out.type=rules.action1;</tag></item>
        <item><ruleref uri="#action2"/>
               the
            <ruleref uri="#object2"/>
            <tag>out.object=rules.object2; out.type=rules.action2;</tag></item>
        <item>turn the
             <ruleref uri="#object1"/>
             <ruleref uri="#action1"/>
             <tag>out.object=rules.object1; out.type=rules.action1;</tag></item>
     </one-of>
  </rule>
</grammar>
`
