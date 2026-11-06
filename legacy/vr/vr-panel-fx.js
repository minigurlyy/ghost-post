export function dismissPanel(group,done,dt){
 if(!group.userData.fadeMaterials){group.userData.fadeMaterials=[];group.traverse(o=>{if(o.isMesh&&!Array.isArray(o.material)){o.material=o.material.clone();o.material.transparent=true;group.userData.fadeMaterials.push([o.material,o.material.opacity]);}});}
 const u=group.userData;u.fade=done?Math.min(1,(u.fade||0)+dt/0.65):0;const k=1-u.fade;
 group.visible=k>0;group.scale.setScalar(1+u.fade*.045);for(const [m,opacity] of u.fadeMaterials)m.opacity=opacity*k;
}
