import React, {useEffect, useLayoutEffect, useRef} from 'react';
import {IconButton} from '@mui/material';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { toLocalTime } from '../../utilities/Time';
import { meState } from '../../../cache';
import {useReactiveVar} from '@apollo/client';
import { alpha } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import Badge from '@mui/material/Badge';
import {useTheme} from '@mui/material/styles';
import TreeView from '@mui/lab/TreeView';
import TreeItem, {useTreeItem} from '@mui/lab/TreeItem';
import SvgIcon from '@mui/material/SvgIcon';
import {gql, useLazyQuery } from '@apollo/client';
import {TaskDisplayContainer} from './TaskDisplayContainer';
import { styled } from '@mui/material/styles';
import clsx from "clsx";

const taskDataFragment = gql`
    fragment taskData on task {
        comment
        callback_id
        commentOperator{
            username
        }
        completed
        id
        operator{
            username
        }
        original_params
        display_params
        status
        timestamp
        command {
          cmd
          id
        }
        command_name
        responses(limit: 1, order_by: {id: desc}){
            id
            timestamp
        }
        opsec_pre_blocked
        opsec_pre_bypassed
        opsec_post_blocked
        opsec_post_bypassed
        tasks {
            id
        }
        token {
            id
        }
    }
`;

const getSubTaskingQuery = gql`
${taskDataFragment}
query getSubTasking($task_id: Int!){
    task(where: {parent_task_id: {_eq: $task_id}}, order_by: {id: asc}) {
        ...taskData
  }
}
 `;

const useStyles = makeStyles((theme) => ({
  root: {
    marginTop: "3px",
    marginLeft: "3px",
    marginRight: "0px",
    height: "auto",
    width: "99%",
    
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    display: "inline",
    cursor: "default"
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    //color: theme.palette.text.secondary,
    overflow: "auto", 
    display: "block", 
    textOverflow: "ellipsis", 
    wordBreak: "break-all",
    maxWidth: "100%", 
  },
  taskAndTimeDisplay: {
    fontSize: theme.typography.pxToRem(12),
    color: theme.palette.text.secondary,
    overflow: "hidden", 
    textOverflow: "ellipsis", 
    maxWidth: "100%", 
    width: "100%",
    whiteSpace: "nowrap",
    display: "inline-block"
  },
  secondaryHeadingExpanded: {
    fontSize: theme.typography.pxToRem(15),
    //color: theme.palette.text.secondary,
    display: "block", 
    overflow: "auto",
    maxWidth: "100%", 
    whiteSpace: "break-all",
    wordBreak: "break-all",
  },
  icon: {
    verticalAlign: 'middle',
    height: 20,
    width: 20,
  },
  details: {
    alignItems: 'center',
    marginRight: 0
  },
  column: {
    padding: "0 5px 0 0",
    display: "inline-block",
    margin: 0,
    height: "auto"
  },
}));
const accordionUseStyles = makeStyles((theme) => ({
  root: {
    margin: 0,
    padding: 0,
    height: "auto",
    width: "100%",
    whiteSpace: "break-all",
    wordBreak: "break-all",
  },
  content: {
    margin: 0,
    height: "100%",
    padding: 0,
  },
  expandIcon: {
    margin: 0,
  },
  expanded: {
    marginRight: 0
  }
}));
const treeItemUseStyles = makeStyles((theme) => ({
  root: {
    marginRight: 0,
    paddingRight: 0,
    '&:hover': {
      backgroundColor: "none"
    },
    width: "100%"
  },
  iconContainer: {
    '& .close': {
      opacity: 0.3,
    },
  },
  group: {
    marginLeft: 7,
    paddingLeft: 18,
    borderLeft: `1px dashed ${alpha(theme.palette.text.primary, 0.4)}`,
  },
}));
function MinusSquare(props) {
  return (
    <SvgIcon fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 11.023h-11.826q-.375 0-.669.281t-.294.682v0q0 .401.294 .682t.669.281h11.826q.375 0 .669-.281t.294-.682v0q0-.401-.294-.682t-.669-.281z" />
    </SvgIcon>
  );
}
function PlusSquare(props) {
  return (
    <SvgIcon fontSize="inherit" style={{ width: 14, height: 14 }} {...props}>
      {/* tslint:disable-next-line: max-line-length */}
      <path d="M22.047 22.074v0 0-20.147 0h-20.12v0 20.147 0h20.12zM22.047 24h-20.12q-.803 0-1.365-.562t-.562-1.365v-20.147q0-.776.562-1.351t1.365-.575h20.147q.776 0 1.351.575t.575 1.351v20.147q0 .803-.575 1.365t-1.378.562v0zM17.873 12.977h-4.923v4.896q0 .401-.281.682t-.682.281v0q-.375 0-.669-.281t-.294-.682v-4.896h-4.923q-.401 0-.682-.294t-.281-.669v0q0-.401.281-.682t.682-.281h4.923v-4.896q0-.401.294-.682t.669-.281v0q.401 0 .682.281t.281.682v4.896h4.923q.401 0 .682.281t.281.682v0q0 .375-.281.669t-.682.294z" />
    </SvgIcon>
  );
}

const CustomTreeItemContent = React.forwardRef(function CustomContent(props, ref) {
  const {
    classes,
    label,
    nodeId,
    icon: iconProp,
    expansionIcon,
    displayIcon,
    onClick
  } = props;

  const {
    handleExpansion,
    preventSelection
  } = useTreeItem(nodeId);

  const icon = iconProp || expansionIcon || displayIcon;
  const customExpansion = (event) => {
    handleExpansion(event);
    if(onClick){
      onClick(event);
    }
  }
  return (
    <div
      style={{display: "inline-flex", alignItems: "center", width: "100%"}}
      onMouseDown={preventSelection}
      ref={ref}
    >
      <div onClick={customExpansion} className={classes.iconContainer}>
        {icon}
      </div>
      {label}
    </div>
  );
});

function TaskDisplayPreMemo({task, filterOptions}){
    
    const classes = useStyles();
    const [nodesSelected, setNodesSelected] = React.useState([]);

    const toggleTaskTree = React.useCallback((task_id, selected) => {
    	if(selected){
    		// we want to add our treenode to the list if it's not there already
    		if(nodesSelected.includes("treenode:" + task_id)){
    			return;
    		}
    		setNodesSelected([...nodesSelected, "treenode:" + task_id]);
    	}else{
    		// we want to remove our treenode from the list if it's there
    		const newSelection = nodesSelected.reduce( (prev, cur) => {
				if(cur === "treenode:" + task_id){
					return [...prev];
				}
				return [...prev, cur];
    		}, [])
    		setNodesSelected(newSelection);
    	}
    }, [nodesSelected]);
  return (
  	<TreeView className={classes.root}
  		expanded={nodesSelected}
    >
      <TaskRow task={task} filterOptions={filterOptions} nodesSelected={nodesSelected} toggleSelection={toggleTaskTree} />
    </TreeView>
  );
}
export const TaskDisplay = React.memo(TaskDisplayPreMemo);

const TaskStatusDisplay = ({task, theme}) => {
  if(task.status.toLowerCase().includes("error")){
    return (<Typography size="small" component="span" style={{padding: "0", color: theme.palette.error.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>{task.status.toLowerCase()}</Typography>)
  }else if(task.status === "cleared"){
    return (<Typography size="small" component="span"  style={{padding: "0", color: theme.palette.warning.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>cleared</Typography>)
  }else if(task.status === "completed"){
    return (null)//return (<Typography size="small" style={{padding: "0", color: theme.palette.success.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>completed</Typography>)
  }else if(task.status === "submitted"){
    return (<Typography size="small" component="span"  style={{padding: "0", color: theme.palette.info.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>{task.status.toLowerCase()}</Typography>)
  }else if(task.status === "processing"){
    return (<Typography size="small" component="span"  style={{padding: "0", color: theme.palette.warning.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>{task.status.toLowerCase()}</Typography>)
  }else if(task.opsec_pre_blocked && !task.opsec_pre_bypassed){
    return (<Typography size="small" component="span"  style={{padding: "0", color: theme.palette.warning.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>OPSEC BLOCKED (PRE)</Typography>)
  }else if(task.opsec_post_blocked && !task.opsec_post_bypassed){
    return (<Typography size="small" component="span"  style={{padding: "0", color: theme.palette.warning.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>OPSEC BLOCKED (POST)</Typography>)
  }else{
      return (<Typography size="small" component="span"  style={{padding: "0", color: theme.palette.info.main, marginLeft: "5%", display: "inline-block", fontSize: theme.typography.pxToRem(15)}}>{task.status.toLowerCase()}</Typography>)
  }
}
const ColoredTaskDisplay = ({task, theme, children}) => {
  const [themeColor, setThemeColor] = React.useState(theme.palette.info.main);
  useEffect( () => {
    if(task.status.toLowerCase().includes("error")){
      setThemeColor(theme.palette.error.main);
    }else if(task.status.toLowerCase() === "cleared"){
      setThemeColor(theme.palette.warning.main);
    }else if(task.status === "submitted"){
      setThemeColor(theme.palette.info.main);
    }else if(task.opsec_pre_blocked && !task.opsec_pre_bypassed){
      setThemeColor(theme.palette.warning.main);
    }else if(task.opsec_post_blocked && !task.opsec_post_bypassed){
      setThemeColor(theme.palette.warning.main);
    }else if(task.status.toLowerCase() === "processing"){
      setThemeColor(theme.palette.warning.main);
    }else if(task.status === "completed"){
        setThemeColor(theme.palette.success.main);
    }else{
      setThemeColor(theme.palette.info.main);
    }
  }, [task.status, task.completed])
    return(
      <span style={{display: "flex", margin: 0, borderWidth: 0, padding: 0, minHeight: "48px", alignItems: "center", height: "100%", borderLeft: "6px solid " + themeColor, paddingLeft: "5px", width: "100%"}}>
        {children}
      </span>
    )
}
const TaskRow = ({task, filterOptions, nodesSelected, toggleSelection}) => {
	  const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [taskingData, setTaskingData] = React.useState({task: []});
    const [isFetchingSubtasks, setIsFetchingSubtasks] = React.useState(false);
    const [shouldDisplay, setShouldDisplay] = React.useState(true);
    const me = useReactiveVar(meState);
    const treeClasses = treeItemUseStyles();
    const [getSubTasking, { startPolling, stopPolling }] = useLazyQuery(getSubTaskingQuery, {
        onError: data => {
            console.error(data)
        },
        fetchPolicy: "network-only",
        notifyOnNetworkStatusChange: true,
        onCompleted: (data) => {
        	if(nodesSelected.includes("treenode:" + task.id)){
        		startPolling(2000);
        	}else{
        		stopPolling();
        		setIsFetchingSubtasks(false);
        		return;
        	}
        	setTaskingData(data);
        }
    });
    const getSubTasks = React.useCallback( (event) => {
    	if(!isFetchingSubtasks){
        	toggleSelection(task.id, true);
        	setIsFetchingSubtasks(true);
    		getSubTasking({variables: {task_id: task.id} });
    		return;
      }
      //// we're already fetching subtasks, but just clicked the minus sign, so stop
      toggleSelection(task.id, false);
    }, [isFetchingSubtasks]);
    useEffect( () => {
      /*props.onSubmit({
      "operatorsList": onlyOperators,
      "commentsFlag": onlyHasComments,
      "commandsList": onlyCommands,
      "everythingButList": everythingBut,
      "parameterString": onlyParameters
    }); */
      if(task.display_params.includes("help") && task.operator.username !== me.user.username){
        setShouldDisplay(false);
        return;
      }
      if(filterOptions === undefined){
        if(!shouldDisplay){
          setShouldDisplay(true);
        }
        return;
      }
      if(filterOptions["operatorsList"].length > 0){
        if(!filterOptions["operatorsList"].includes(task.operator.username)){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["commentsFlag"]){
        if(task.comment === ""){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["commandsList"].length > 0){
        // only show these commands
        if(!filterOptions["commandsList"].includes(task.command_name)){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(filterOptions["everythingButList"].length > 0){
          if(filterOptions["everythingButList"].includes(task.command_name)){
            if(shouldDisplay){
              setShouldDisplay(false);
            }
            return;
          }
      }
      if(filterOptions["parameterString"] !== ""){
        let regex = new RegExp(filterOptions["parameterString"]);
        if(!regex.test(task.display_params)){
          if(shouldDisplay){
            setShouldDisplay(false);
          }
          return;
        }
      }
      if(!shouldDisplay){
        setShouldDisplay(true);
      }
    }, [filterOptions, task.comment, task.command, task.display_params, task.operator.username]);
    const toggleTaskDropdown = React.useCallback( (event, expanded) => {
      setDropdownOpen(!dropdownOpen);
    }, [dropdownOpen]);
    
    useEffect( () => {
      if(!isFetchingSubtasks && task.tasks.length > 0){
        getSubTasks();
      }
    }, [task.tasks])
    return (
      shouldDisplay ? (
        <TreeItem nodeId={"treenode:" + task.id}
          classes={treeClasses}
          ContentComponent={CustomTreeItemContent}
          ContentProps={{
            onClick: getSubTasks,
            icon: nodesSelected.includes("treenode:" + task.id) ? <MinusSquare /> : task.tasks.length > 0 ? <PlusSquare /> : null,
            label: <TaskLabel task={task} dropdownOpen={dropdownOpen} toggleTaskDropdown={toggleTaskDropdown}/>,
            
          }}>
          {
            taskingData.task.map( (tsk) => (
              <TaskRow key={"taskrow: " + tsk.id} task={tsk} nodesSelected={nodesSelected} filterOptions={filterOptions} toggleSelection={toggleSelection}/>
            ))
          }
      </TreeItem>
      ) : (null)
    )
}
const TaskLabel = ({task, dropdownOpen, toggleTaskDropdown}) => {
  const [fromNow, setFromNow] = React.useState( (new Date()) );
  const me = useReactiveVar(meState);
  const theme = useTheme();
  const [displayComment, setDisplayComment] = React.useState(false);
  const [alertBadges, setAlertBadges] = React.useState(0);
  const classes = useStyles();
  const accordionClasses = accordionUseStyles();
  const toggleDisplayComment = (evt) => {
    evt.stopPropagation();
    setDisplayComment(!displayComment);
  }
  const prevResponseMaxId = useRef(0);
  useLayoutEffect( () => {
    scrollContent();
  }, [])
  useEffect( () => {
    //console.log("in use effect", prevResponseCount.current, props.task.responses);
    let currentData = task?.responses?.length > 0 ? task.responses[0] : {id: 0, timestamp: 0};
    if(!dropdownOpen){
      if((new Date(currentData.timestamp + "Z")) > fromNow){
        if(prevResponseMaxId.current === 0){
          toggleTaskDropdown();
        }else if(currentData.id > prevResponseMaxId.current){
          setAlertBadges(1);
        }
      }
        
    }else{
      prevResponseMaxId.current = currentData.id;
      setAlertBadges(0);
    }
  }, [task.responses, dropdownOpen]);
  const scrollContent = (node, isAppearing) => {
    document.getElementById(`scrolltotask${task.id}`).scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "start"
      })
  }

  return(
    <Paper className={classes.root} elevation={5} style={{marginRight: 0}} id={`taskHeader-${task.id}`}>
      <Accordion TransitionProps={{ unmountOnExit: true, onEntered: scrollContent }} defaultExpanded={false} onChange={toggleTaskDropdown} expanded={dropdownOpen} >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls={`panel1c-content-task-${task.id}`}
          id={`panel1c-header-${task.id}`}
          classes={accordionClasses}
        >  
          <ColoredTaskDisplay task={task} theme={theme}>
              <div id={'scrolltotask' + task.id} style={{width: "100%"}}>
                {displayComment ? (
                    <React.Fragment>
                        <Typography className={classes.secondaryHeading}>{task.commentOperator.username}</Typography>
                        <Typography className={classes.heading}>{task.comment}</Typography>
                    </React.Fragment>
                  ) : (null)}
                    <Typography className={classes.taskAndTimeDisplay}>[{toLocalTime(task.timestamp, me.user.view_utc_time)}] / {task.id} / {task.operator.username}
                      <TaskStatusDisplay task={task} theme={theme}/>
                    </Typography>
                  <div>
                  {task.comment !== "" ? (
                        <div className={classes.column}>
                            <IconButton size="small" style={{padding: "0"}} color="primary" onClick={toggleDisplayComment}><ChatOutlinedIcon/></IconButton>
                          </div>
                      ) : (null)}
                    <div className={classes.column}>
                        <Badge badgeContent={alertBadges} color="secondary" anchorOrigin={{vertical: 'top', horizontal: 'left'}}>
                          <Typography className={classes.heading} onClick={(e) => {e.stopPropagation();}} >
                            {task.command_name + " " + task.display_params}
                          </Typography>
                        </Badge>
                      </div>
                </div>
            </div>
          </ColoredTaskDisplay>          
        </AccordionSummary>
        <AccordionDetails style={{cursor: "default"}}>
          <TaskDisplayContainer task={task}/>
        </AccordionDetails>
      </Accordion>
  </Paper>
  )
}